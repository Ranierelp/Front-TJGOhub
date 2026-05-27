# Histórico de edições do Caso de Teste

Guia de estudo da feature de auditoria implementada no TJGOhub. Lê de cima
pra baixo na ordem em que o dado viaja: backend → API → front.

---

## 1. Visão geral

**Problema que resolvemos:**
A tela de visualizar um caso de teste mostrava só a última edição (timestamp).
Sem como saber *quem* mudou *o quê* e *quando*. Pra um sistema de gestão de
testes de produção isso é uma lacuna real (auditoria, rastreio de regressão).

**Solução:**
A cada save no `TestCase` (e em seus anexos), uma cópia do estado é gravada
numa "shadow table". Quando o usuário abre a aba **Histórico** na tela do
caso, o front busca essas cópias, calcula o diff entre versões consecutivas e
renderiza uma timeline cronológica.

**Tecnologia chave:** [`django-simple-history`](https://django-simple-history.readthedocs.io)
— lib mainstream do ecossistema Django (Jazzband) que automatiza a criação e
manutenção das shadow tables.

---

## 2. Arquitetura — caminho do dato

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Usuário edita o caso (PUT/PATCH ou ação custom)                        │
│                            │                                            │
│                            ▼                                            │
│  Django save() → signal post_save do simple-history                     │
│                            │                                            │
│                            ▼                                            │
│  INSERT em HistoricalTestCase (snapshot completo +                      │
│              history_date + history_user + history_type)                │
└─────────────────────────────────────────────────────────────────────────┘

                          ─── tempo passa ───

┌─────────────────────────────────────────────────────────────────────────┐
│  Usuário abre aba "Histórico" no front                                  │
│                            │                                            │
│                            ▼                                            │
│  GET /api/v1/test-cases/{id}/history/                                   │
│                            │                                            │
│                            ▼                                            │
│  build_history_timeline(case) lê HistoricalTestCase +                   │
│   HistoricalTestCaseAttachment, compara pares consecutivos              │
│   (diff_against), traduz pra labels PT-BR, mescla as duas               │
│   fontes e devolve lista ordenada                                       │
│                            │                                            │
│                            ▼                                            │
│  CaseHistoryTimeline renderiza vertical agrupada por dia                │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Backend

### 3.1 — Instalação e configuração

**`requirements/base.txt`** ganhou 1 linha:
```
django-simple-history==3.11.0
```

**`tjgohub/settings/base.py`** ganhou 2 mudanças:

1. `"simple_history"` em `INSTALLED_APPS` (faz Django reconhecer as migrations
   da lib e cadastrar os signals).

2. `"simple_history.middleware.HistoryRequestMiddleware"` em `MIDDLEWARE`.
   Esse middleware é o que **preenche `request.user` automaticamente** em cada
   snapshot — sem ele os snapshots ficam órfãos (`history_user=None`) quando
   salvos fora do shell.

### 3.2 — Marcando os models como auditáveis

Em [`apps/cases/models.py`](../../tjgo-playwright-hub/apps/cases/models.py),
adicionamos `HistoricalRecords` em dois modelos:

```python
from simple_history.models import HistoricalRecords

class TestCase(BaseModel):
    # ... campos ...

    history = HistoricalRecords(
        excluded_fields=[
            "updated_at", "is_active", "deleted_at", "deleted_by",
            "kanban_column", "board_position",
            "slug", "last_modified_by",
        ],
        m2m_fields=["tags"],
    )

class TestCaseAttachment(BaseModel):
    # ... campos ...

    history = HistoricalRecords(
        excluded_fields=["updated_at", "is_active", "deleted_at", "deleted_by"],
    )
```

**O que `HistoricalRecords` faz por baixo:**

- Cria automaticamente uma classe `HistoricalTestCase` (gerada na hora da
  `makemigrations`) que vira uma tabela `cases_historicaltestcase` no banco.
- Ela tem **todos os campos** do `TestCase` (menos os de `excluded_fields`),
  **mais** quatro campos extras:
  - `history_id` — PK auto
  - `history_date` — quando foi gravado
  - `history_user` — FK pro User que disparou o save (vem do middleware)
  - `history_type` — `+` (create), `~` (update), `-` (delete)
- Conecta um signal `post_save` que, depois de cada save no original, faz um
  `INSERT` na shadow table com o estado **completo** atual.

**Por que `excluded_fields`?**
Campos auto/sistema (timestamps, `is_active`, posição do kanban) não interessam
na timeline. Sem excluir eles, cada mudança de posição no board geraria uma
entrada inútil tipo "moveu de posição 3 pra 4".

**Por que `m2m_fields=["tags"]`?**
M2M não dispara `post_save` do model — dispara `m2m_changed` separadamente.
O simple-history só captura M2M se você listar aqui. Sem isso, adicionar/
remover uma tag não apareceria no histórico.

### 3.3 — Service que monta a timeline

Arquivo: [`apps/cases/services/history.py`](../../tjgo-playwright-hub/apps/cases/services/history.py).

O backend não devolve os snapshots crus pro front (seria um payload pesado e
sem semântica). Em vez disso, um **service** transforma os snapshots em
"entries" pré-mastigadas:

**Funções principais:**

| Função | O que faz |
|---|---|
| `_diff_changes(current, prev)` | Usa `current.diff_against(prev)` (API do simple-history) pra pegar os campos que mudaram. Filtra por `FIELD_LABELS` — campos sem label são ignorados. |
| `_tags_changes(current, prev)` | Compara `current.tags.all()` vs `prev.tags.all()` e devolve `{added: [...], removed: [...]}` com os **nomes** das tags. |
| `_display_value(field, value)` | Traduz valor bruto pra UI. Ex.: `"MEDIUM"` → `"Média"`, FK ID → nome do projeto/usuário. |
| `_user_payload(user)` | Devolve `{id, name, initials}` ou `None` se snapshot legado sem autor. |
| `_testcase_entries(case)` | Generator que percorre os snapshots do caso. Primeiro snapshot vira `kind="create"`; demais comparam com o anterior e viram `kind="edit"` (ou pulam se nenhuma mudança auditada). |
| `_attachment_entries(att)` | Mesma ideia, mas devolve `kind="attachment_added/updated/removed"` baseado em `history_type`. |
| `build_history_timeline(case)` | **Entrada principal.** Mescla as duas listas e ordena por data desc. |

**Dicionário-chave: `FIELD_LABELS`**

Mapa de `nome_técnico_do_campo → "Label PT-BR"`. É a **fonte de verdade** do
que aparece na timeline. Quando alguém adicionar um campo novo ao TestCase
que deva aparecer no histórico, **precisa lembrar de adicionar a entrada aqui**.
Sem entrada, a mudança é silenciosamente ignorada.

### 3.4 — Endpoint

Adicionado em [`apps/cases/api/v1/viewsets.py`](../../tjgo-playwright-hub/apps/cases/api/v1/viewsets.py):

```python
@action(detail=True, methods=["get"], url_path="history")
def history(self, request, id=None):
    case = self.get_object()
    entries = build_history_timeline(case)
    return Response(entries, status=status.HTTP_200_OK)
```

Como herda do `BaseModelApiViewSet`, vem com permissão `IsAuthenticated +
DjangoModelPermissions` automaticamente. Quem pode ler o caso pode ler o
histórico.

URL final: **`GET /api/v1/test-cases/{id}/history/`**

### 3.5 — Formato da resposta

Lista de dicionários. Cada um tem um `kind` que discrimina o conteúdo:

```jsonc
[
  {
    "kind": "edit",
    "edited_at": "2026-05-26T14:32:00Z",
    "edited_by": { "id": "uuid", "name": "Ranier", "initials": "RP" },
    "changes": [
      { "field": "priority", "label": "Prioridade", "from": "Média", "to": "Alta" },
      { "field": "tags",     "label": "Tags",       "added": ["Crítico"], "removed": [] }
    ]
  },
  {
    "kind": "attachment_added",
    "edited_at": "2026-05-26T13:00:00Z",
    "edited_by": { "id": "uuid", "name": "Letícia", "initials": "LP" },
    "attachment": { "id": "uuid", "title": "Passo 3", "order": 2 }
  },
  {
    "kind": "create",
    "edited_at": "2026-05-25T09:15:00Z",
    "edited_by": { "id": "uuid", "name": "Ranier", "initials": "RP" },
    "changes": []
  }
]
```

**Detalhes importantes:**

- Ordem: mais recente primeiro.
- `from`/`to` já vêm **formatados** ("Média", não "MEDIUM") — o front só
  renderiza.
- `tags` é tratada como caso especial dentro de `changes` — vem com
  `added`/`removed` em vez de `from`/`to`.
- `edited_by` pode ser `null` em casos legados (snapshots feitos antes do
  middleware estar ativo ou via shell sem `set_history_user`).

---

## 4. Frontend

### 4.1 — Camada de API

Arquivo: [`lib/api/caseHistory.ts`](../lib/api/caseHistory.ts).

Contém **tipos** + **função de fetch** — segue o padrão dos outros módulos da
API (`projects.ts`, `runs.ts`).

**Discriminated union** representa as entradas:

```ts
export type CaseHistoryEntry =
  | { kind: "create" | "edit"; edited_at, edited_by, changes: CaseChange[] }
  | { kind: "attachment_added" | ...; edited_at, edited_by, attachment }
```

Type guards (`isTagsChange`, `isFieldChange`) ajudam o componente a discriminar
dentro de `changes`.

### 4.2 — Componente da timeline

Arquivo: [`app/dashboard/casos/[id]/_components/CaseHistoryTimeline.tsx`](../app/dashboard/casos/[id]/_components/CaseHistoryTimeline.tsx).

Componente **autocontido** — recebe só `caseId` e cuida do próprio fetch,
loading, erro e render.

**Estados internos (state machine):**

```ts
type LoadState =
  | { status: 'loading' }
  | { status: 'success'; entries: CaseHistoryEntry[] }
  | { status: 'error'; message: string };
```

Esse padrão evita o famoso "três useState booleanos" (`loading`, `error`,
`data`) que sempre confunde porque tem estados impossíveis (`loading=true`
+ `error="..."` ao mesmo tempo). Aqui só um deles existe a qualquer momento.

**Padrões interessantes no componente:**

1. **`Intl.RelativeTimeFormat`** — converte ISO em "há 2 horas" sem precisar
   de lib (dayjs, date-fns). Funciona nativamente em browsers modernos.

2. **Bucketing por dia** — agrupa entradas em "Hoje / Ontem / Anterior" pra
   facilitar leitura. Função `bucketOf(iso)` decide qual bucket.

3. **`AbortController` + flag `mounted`** — quando o usuário troca de aba
   rapidamente, evita `setState` após unmount (warning do React) e cancela
   request pendente.

4. **Retry sem reload** — `retryToken` é um número incremental no useEffect
   deps. Clicar "Tentar novamente" bumpa o token → useEffect roda de novo.

5. **Exhaustive check com `never`** — `default` do `switch` tem
   `const _exhaustive: never = entry`. Se um dia adicionarmos `kind` novo no
   backend, TypeScript falha aqui — força a tratar o caso novo.

6. **Avatar + IconBadge sobrepostos** — wrapper com `position: relative`,
   avatar dentro, badge com `position: absolute` no canto. Padrão usado em
   apps tipo Linear/Notion.

### 4.3 — Integração com as abas

Arquivo: [`app/dashboard/casos/[id]/_components/CaseViewMode.tsx`](../app/dashboard/casos/[id]/_components/CaseViewMode.tsx).

**O que mudou:**

- Adicionado `useState<Tab>("overview")` (tipo `Tab = "overview" | "history"`).
- Inserida uma barra de tabs entre o header e o conteúdo, com:
  - `role="tablist"` + `role="tab"` + `aria-selected` (a11y).
  - Underline animado na aba ativa via `<span>` com `position: absolute`.
- Conteúdo original (tags row + grid 3 colunas) envolvido em
  `{activeTab === "overview" && (...)}`.
- Nova seção `{activeTab === "history" && <CaseHistoryTimeline caseId={caso.id} />}`.

**Por que tabs feitas na mão e não Radix Tabs?**

Tabs é um dos componentes mais simples (só "qual aba está ativa") — usar
Radix seria adicionar uma dep só pra encapsular um `useState`. O custo
de manutenção é menor mantendo na mão. Se um dia precisarmos de URL
syncing ou keyboard nav avançada, daí migramos.

---

## 5. Casos de borda / o que pensar quando precisar mexer

### 5.1 — Concorrência (dois usuários editando ao mesmo tempo)

Como **não tem optimistic locking**, o último PATCH vence. Mas **as duas
edições viram entradas separadas na timeline**, então dá pra reconstruir:

```
14:33  Ranier editou Prioridade: Média → Alta
14:32  Letícia editou Prioridade: Média → Crítica
```

Se quiser **prevenir** o conflito (não só registrar), seria adicionar campo
`version` no TestCase e fazer o backend rejeitar PATCH se a versão não bater.
**Está fora do escopo dessa feature** — feature separada.

### 5.2 — Tempo real

A timeline **não é live**. Se a Letícia abrir o histórico e o Ranier editar
em seguida, ela só vê depois de dar F5 ou clicar em "Tentar novamente". Pra
fazer live precisaria WebSocket (Django Channels) ou polling — também fora
do escopo.

### 5.3 — Tamanho da shadow table

Cada save do TestCase = 1 row a mais em `cases_historicaltestcase`. Em 1 ano
de uso intenso isso vai crescer. Se virar problema, opções:

- **Política de retenção** com cron: deletar snapshots mais antigos que
  X dias. Tem comando do simple-history pra isso (`clean_duplicate_history`).
- **Particionamento** por mês (Postgres) — mais avançado.
- **Resumir** snapshots antigos numa tabela agregada.

Não vou implementar nada disso agora — só anotar.

### 5.4 — Migração de dados antigos

**Histórico só conta do dia que mergear a feature.** Edições anteriores são
invisíveis na timeline. Não tem solução — DBs não guardam o passado
retroativamente.

### 5.5 — Adicionar campo novo ao TestCase

Quando o backend adicionar campo novo (ex.: `due_date`):

1. Se for relevante na timeline → adicionar no `FIELD_LABELS` em
   `apps/cases/services/history.py` com label PT-BR.
2. Se for valor enum/FK → adicionar tradução em `_display_value()`.
3. Se for irrelevante (auto-field, posição) → adicionar em `excluded_fields`
   do `HistoricalRecords` no model. **Importante**: depois rodar
   `makemigrations` pra atualizar a shadow table.

---

## 6. Como testar localmente

### 6.1 — Setup

```bash
# Container do backend (depois de rebuild com a nova lib):
docker exec -it tjgohub-api python manage.py makemigrations cases
docker exec -it tjgohub-api python manage.py migrate
```

### 6.2 — Cenário de teste manual

1. Logar com usuário A. Criar um caso de teste.
2. Editar prioridade.
3. Adicionar tag.
4. Logar com usuário B. Editar título do mesmo caso.
5. Adicionar passo (anexo).
6. Voltar pra usuário A. Abrir o caso, clicar na aba **Histórico**.

**Esperado:**
- 5 entradas, mais recente no topo.
- Cada uma com avatar correto (A ou B) + descrição da ação + chips de mudança.
- Bucketing por dia: tudo de "Hoje".
- Tooltip ao hover no timestamp mostra data/hora absoluta.

### 6.3 — Verificar no banco

```sql
-- Ver os snapshots crus:
SELECT history_date, history_type, history_user_id, title, priority, status
FROM cases_historicaltestcase
WHERE id = '<uuid_do_caso>'
ORDER BY history_date DESC;
```

Vai aparecer 1 row por save. `history_type` é `+` no create e `~` nos updates.

---

## 7. Arquivos tocados (referência rápida)

### Backend

- `requirements/base.txt` — adicionado `django-simple-history==3.11.0`
- `tjgohub/settings/base.py` — `simple_history` em apps + middleware
- `apps/cases/models.py` — `HistoricalRecords` em TestCase e TestCaseAttachment
- `apps/cases/services/__init__.py` — novo módulo
- `apps/cases/services/history.py` — service `build_history_timeline`
- `apps/cases/api/v1/viewsets.py` — action `history` em TestCaseViewSet
- Migration nova em `apps/cases/migrations/` (gerada por `makemigrations`)

### Frontend

- `lib/api/caseHistory.ts` — tipos + `fetchCaseHistory`
- `app/dashboard/casos/[id]/_components/CaseHistoryTimeline.tsx` — UI
- `app/dashboard/casos/[id]/_components/CaseViewMode.tsx` — abas + integração

---

## 8. Recursos pra aprofundar

- **django-simple-history docs**: https://django-simple-history.readthedocs.io/
- **Padrão de discriminated union em TS**: ótimo pra modelar `kind`-based
  variants. Procurar "tagged unions TypeScript".
- **`Intl.RelativeTimeFormat`**: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/RelativeTimeFormat
- **State machine em React**: artigo clássico do Kent C. Dodds sobre o
  pattern de `useReducer` com `{ status: ... }`.

---

**Última atualização:** 2026-05-26 (implementação inicial).
