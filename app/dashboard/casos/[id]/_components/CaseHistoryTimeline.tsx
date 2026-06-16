/**
 * CaseHistoryTimeline.tsx
 *
 * Timeline de edições de um caso de teste, baseada no mockup "Opção B — Abas na sidebar".
 * Este componente é o conteúdo da aba "Histórico" — o controle de abas vive no
 * pai (CaseViewMode), então aqui não há nenhuma lógica de tabs.
 *
 * Fluxo:
 *   1. Faz fetch via fetchCaseHistory(caseId)
 *   2. Renderiza skeleton enquanto carrega
 *   3. Em erro: toast (sonner) + mensagem inline
 *   4. Em sucesso: timeline vertical agrupada por dia (Hoje / Ontem / Anterior),
 *      cada entrada com avatar do autor, descrição da ação, chips de mudança
 *      e timestamp relativo (tooltip com timestamp absoluto).
 *
 * Acessibilidade: cada entrada é um <article> com aria-label descritivo.
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Clock,
  FileMinus,
  FilePlus,
  Pencil,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  fetchCaseHistory,
  isTagsChange,
  type CaseChange,
  type CaseHistoryEntry,
  type FieldChange,
  type HistoryAuthor,
} from '@/lib/api/caseHistory';

// =============================================================================
// Tipos auxiliares
// =============================================================================

interface Props {
  caseId: string;
  /** Classe opcional pra o container externo (espaçamento na aba). */
  className?: string;
}

type LoadState =
  | { status: 'loading' }
  | { status: 'success'; entries: CaseHistoryEntry[] }
  | { status: 'error'; message: string };

// =============================================================================
// Tokens reutilizados — o projeto define --danger-fg mas não --danger-bg,
// então geramos o fundo via color-mix (padrão usado no CaseViewMode).
// =============================================================================

const DANGER_BG_SOFT = 'color-mix(in oklab, var(--danger-fg) 18%, transparent)';

// =============================================================================
// Helpers de data/hora
// =============================================================================

// Intl.RelativeTimeFormat é instanciado uma única vez — barato, mas evita
// recriar a cada render.
const RTF = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });
const ABS_FMT = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
});

/**
 * Converte ISO 8601 → "há 2 horas" / "ontem" / "há 3 dias" etc.
 * Escolhe a maior unidade que faz sentido (segundos < 60 → "agora mesmo").
 */
function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffSec = Math.round((then - now) / 1000); // negativo = passado

  const abs = Math.abs(diffSec);
  if (abs < 45) return 'agora mesmo';
  if (abs < 3600) return RTF.format(Math.round(diffSec / 60), 'minute');
  if (abs < 86400) return RTF.format(Math.round(diffSec / 3600), 'hour');
  if (abs < 86400 * 7) return RTF.format(Math.round(diffSec / 86400), 'day');
  if (abs < 86400 * 30) return RTF.format(Math.round(diffSec / (86400 * 7)), 'week');
  if (abs < 86400 * 365) return RTF.format(Math.round(diffSec / (86400 * 30)), 'month');
  return RTF.format(Math.round(diffSec / (86400 * 365)), 'year');
}

function formatAbsolute(iso: string): string {
  return ABS_FMT.format(new Date(iso));
}

/**
 * Agrupamento por bucket de tempo. Mantém ordem original (mais recente primeiro)
 * porque o backend já entrega assim.
 */
type Bucket = 'Hoje' | 'Ontem' | 'Anterior';

function bucketOf(iso: string): Bucket {
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) return 'Hoje';

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate();
  return isYesterday ? 'Ontem' : 'Anterior';
}

// =============================================================================
// Subcomponente: Avatar
// =============================================================================

/**
 * Avatar do autor. Mostra a foto quando houver; senão cai no gradient azul
 * institucional com as iniciais. Quando o autor é null (caso legado), mostra "?".
 * O Radix exibe o fallback automaticamente se a imagem falhar ao carregar.
 */
function AuthorAvatar({ author, size = 28 }: { author: HistoryAuthor | null; size?: number }) {
  return (
    <Avatar
      className="flex-shrink-0 shadow-[inset_0_0_0_1.5px_rgba(255,255,255,0.18)]"
      style={{ width: size, height: size }}
      aria-hidden
    >
      {author?.avatar && <AvatarImage src={author.avatar} alt={author.name} />}
      <AvatarFallback
        className="font-bold"
        style={{
          fontSize: size * 0.4,
          background: author
            ? 'linear-gradient(135deg, #2563EB, #3B82F6)'
            : 'var(--col-divider)',
          color: author ? '#fff' : 'var(--col-dim)',
        }}
      >
        {author?.initials ?? '?'}
      </AvatarFallback>
    </Avatar>
  );
}

// =============================================================================
// Subcomponente: ChangeChip — uma única mudança (campo ou tag)
// =============================================================================

interface ChangeChipProps {
  change: CaseChange;
}

function ChangeChip({ change }: ChangeChipProps) {
  // Caso especial: tags têm "added" e "removed" — renderizamos uma sequência
  // de chips coloridos em vez de um único "from → to".
  if (isTagsChange(change)) {
    // Defesa em profundidade: se o backend (ou um cache antigo) mandar
    // tags sem os arrays, normaliza pra [] em vez de quebrar.
    const added = change.added ?? [];
    const removed = change.removed ?? [];
    return (
      <span className="inline-flex flex-wrap items-center gap-1">
        <span className="text-[11px] font-semibold" style={{ color: 'var(--col-label)' }}>
          {change.label}:
        </span>
        {added.map((t) => (
          <span
            key={`add-${t}`}
            className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-[1px] font-mono text-[10.5px] font-semibold"
            style={{
              background: 'var(--success-bg)',
              color: 'var(--success-fg)',
            }}
          >
            <span aria-hidden>+</span>
            {t}
          </span>
        ))}
        {removed.map((t) => (
          <span
            key={`rm-${t}`}
            className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-[1px] font-mono text-[10.5px] font-semibold line-through"
            style={{
              background: DANGER_BG_SOFT,
              color: 'var(--danger-fg)',
            }}
          >
            <span aria-hidden>−</span>
            {t}
          </span>
        ))}
      </span>
    );
  }

  // Campo simples: "Label: From → To"
  // Usamos seta unicode "→" — é renderizada bem em qualquer fonte e fica mais
  // compacta do que o ícone ArrowRight (que ocuparia altura extra na pílula).
  const fc = change as FieldChange;
  return (
    <span
      className="inline-flex max-w-full items-center gap-1 rounded-md border px-2 py-[2px] text-[11px]"
      style={{
        background: 'var(--col-surface)',
        borderColor: 'var(--glass-inner-border)',
        color: 'var(--col-body)',
      }}
    >
      <span className="font-semibold" style={{ color: 'var(--col-label)' }}>
        {fc.label}:
      </span>
      <span className="font-mono" style={{ color: 'var(--col-dim)' }}>
        {fc.from ?? '—'}
      </span>
      <span aria-hidden style={{ color: 'var(--col-faint)' }}>
        →
      </span>
      <span className="font-mono font-semibold" style={{ color: 'var(--col-heading)' }}>
        {fc.to ?? '—'}
      </span>
    </span>
  );
}

// =============================================================================
// Subcomponente: TimelineEntry
// =============================================================================

interface IconBadgeProps {
  icon: React.ReactNode;
  tone: 'brand' | 'success' | 'danger' | 'edit';
}

/** Badge pequeno colado no canto inferior do avatar, sinalizando a natureza da ação. */
function IconBadge({ icon, tone }: IconBadgeProps) {
  const palette = {
    brand:   { bg: 'var(--brand-bg)',   fg: 'var(--brand-fg)' },
    success: { bg: 'var(--success-bg)', fg: 'var(--success-fg)' },
    danger:  { bg: DANGER_BG_SOFT,      fg: 'var(--danger-fg)' },
    edit:    { bg: '#ede9fe',           fg: '#6d28d9' }, // roxo discreto pra "edição"
  }[tone];
  return (
    <span
      className="absolute -bottom-0.5 -right-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full border-2"
      style={{
        background: palette.bg,
        color: palette.fg,
        borderColor: 'var(--glass-card-bg)',
      }}
      aria-hidden
    >
      {icon}
    </span>
  );
}

function TimelineEntry({ entry }: { entry: CaseHistoryEntry }) {
  const authorName = entry.edited_by?.name ?? 'Usuário removido';

  // Renderiza o conteúdo da entrada dependendo do tipo (kind).
  // Voltamos um objeto { icon, headline, body } pra manter o layout uniforme.
  const rendered = useMemo(() => {
    switch (entry.kind) {
      case 'create':
        return {
          badge: <IconBadge tone="brand" icon={<Sparkles className="h-2.5 w-2.5" />} />,
          headline: (
            <>
              <strong className="font-semibold" style={{ color: 'var(--col-heading)' }}>
                {authorName}
              </strong>{' '}
              <span style={{ color: 'var(--col-body)' }}>criou este caso</span>
            </>
          ),
          body: null,
        };

      case 'edit': {
        // Quando não há mudanças (improvável, mas o tipo permite), mostramos
        // só a headline pra não renderizar lista vazia.
        const changes = entry.changes ?? [];
        return {
          badge: <IconBadge tone="edit" icon={<Pencil className="h-2.5 w-2.5" />} />,
          headline: (
            <>
              <strong className="font-semibold" style={{ color: 'var(--col-heading)' }}>
                {authorName}
              </strong>{' '}
              <span style={{ color: 'var(--col-body)' }}>
                editou {changes.length > 0 ? `${changes.length} ${changes.length === 1 ? 'campo' : 'campos'}` : 'o caso'}
              </span>
            </>
          ),
          body:
            changes.length > 0 ? (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {changes.map((c, i) => (
                  <ChangeChip key={`${c.field}-${i}`} change={c} />
                ))}
              </div>
            ) : null,
        };
      }

      case 'attachment_added':
        return {
          badge: <IconBadge tone="success" icon={<FilePlus className="h-2.5 w-2.5" />} />,
          headline: (
            <>
              <strong className="font-semibold" style={{ color: 'var(--col-heading)' }}>
                {authorName}
              </strong>{' '}
              <span style={{ color: 'var(--col-body)' }}>
                adicionou o passo{' '}
                <span className="font-mono font-semibold" style={{ color: 'var(--col-heading)' }}>
                  {entry.attachment.title}
                </span>
              </span>
            </>
          ),
          body: null,
        };

      case 'attachment_updated':
        return {
          badge: <IconBadge tone="edit" icon={<Pencil className="h-2.5 w-2.5" />} />,
          headline: (
            <>
              <strong className="font-semibold" style={{ color: 'var(--col-heading)' }}>
                {authorName}
              </strong>{' '}
              <span style={{ color: 'var(--col-body)' }}>
                atualizou o passo{' '}
                <span className="font-mono font-semibold" style={{ color: 'var(--col-heading)' }}>
                  {entry.attachment.title}
                </span>
              </span>
            </>
          ),
          body: null,
        };

      case 'attachment_removed':
        return {
          badge: <IconBadge tone="danger" icon={<FileMinus className="h-2.5 w-2.5" />} />,
          headline: (
            <>
              <strong className="font-semibold" style={{ color: 'var(--col-heading)' }}>
                {authorName}
              </strong>{' '}
              <span style={{ color: 'var(--col-body)' }}>
                removeu o passo{' '}
                <span className="font-mono" style={{ color: 'var(--col-dim)' }}>
                  {entry.attachment.title}
                </span>
              </span>
            </>
          ),
          body: null,
        };

      // O exhaustive-check abaixo garante warning de tipo se um kind novo for
      // adicionado no backend e esquecermos de tratar aqui.
      default: {
        const _exhaustive: never = entry;
        void _exhaustive;
        return { badge: null, headline: null, body: null };
      }
    }
  }, [entry, authorName]);

  // aria-label descritivo: lê "Raniere editou 2 campos, há 2 horas"
  const ariaLabel = `${authorName} — ${formatRelative(entry.edited_at)}`;

  return (
    <article
      aria-label={ariaLabel}
      className="relative flex items-start gap-3 py-2.5"
    >
      {/* Avatar + badge da ação. position: relative pra o badge ficar absoluto sobre ele. */}
      <span className="relative" style={{ width: 28, height: 28 }}>
        <AuthorAvatar author={entry.edited_by} size={28} />
        {rendered.badge}
      </span>

      <div className="min-w-0 flex-1">
        <div className="text-[12px] leading-relaxed">{rendered.headline}</div>
        {rendered.body}
        <time
          // title nativo serve como tooltip — evita acoplar um Tooltip wrapper
          // só pra isso. A11y: dateTime semântico pro screen reader.
          title={formatAbsolute(entry.edited_at)}
          dateTime={entry.edited_at}
          className="mt-1 inline-block font-mono text-[10.5px]"
          style={{ color: 'var(--col-faint)' }}
        >
          {formatRelative(entry.edited_at)}
        </time>
      </div>
    </article>
  );
}

// =============================================================================
// Subcomponente: Skeleton
// =============================================================================

function TimelineSkeleton() {
  return (
    <div className="relative" aria-busy="true" aria-live="polite">
      {/* Linha vertical mock */}
      <div
        className="absolute bottom-3 left-[13px] top-3 w-[2px]"
        style={{ background: 'var(--col-divider)' }}
        aria-hidden
      />
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-start gap-3 py-2.5">
          <span
            className="h-7 w-7 flex-shrink-0 animate-pulse rounded-full"
            style={{ background: 'var(--col-divider)' }}
          />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span
              className="h-3 w-2/3 animate-pulse rounded"
              style={{ background: 'var(--col-divider)' }}
            />
            <span
              className="h-3 w-1/3 animate-pulse rounded"
              style={{ background: 'var(--glass-inner-border)' }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// Subcomponente: EmptyState
// =============================================================================

function EmptyState() {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 py-10 text-center"
      role="status"
    >
      <span
        className="inline-flex h-9 w-9 items-center justify-center rounded-full"
        style={{ background: 'var(--col-surface)', color: 'var(--col-dim)' }}
      >
        <Clock className="h-4 w-4" />
      </span>
      <p className="text-[12px]" style={{ color: 'var(--col-muted)' }}>
        Nenhuma edição registrada ainda.
      </p>
    </div>
  );
}

// =============================================================================
// Subcomponente: ErrorState (inline — o toast é disparado em paralelo)
// =============================================================================

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 py-8 text-center"
      role="alert"
    >
      <AlertCircle className="h-5 w-5" style={{ color: 'var(--danger-fg)' }} />
      <p className="text-[12px]" style={{ color: 'var(--col-body)' }}>
        Não foi possível carregar o histórico.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-md px-2.5 py-1 text-[11.5px] font-semibold"
        style={{ background: 'var(--brand-bg)', color: 'var(--brand-fg)' }}
      >
        Tentar novamente
      </button>
    </div>
  );
}

// =============================================================================
// Componente principal
// =============================================================================

export function CaseHistoryTimeline({ caseId, className = '' }: Props) {
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  // O ciclo de fetch fica num useEffect dedicado pra suportar retry (basta
  // bumpar uma key local). Usamos AbortController pra evitar setState após
  // unmount quando o usuário troca de aba rapidamente.
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    const ctrl = new AbortController();
    let mounted = true;

    setState({ status: 'loading' });

    fetchCaseHistory(caseId /*, { signal: ctrl.signal } se a API aceitar */)
      .then((entries) => {
        if (!mounted) return;
        setState({ status: 'success', entries });
      })
      .catch((err: unknown) => {
        if (!mounted || ctrl.signal.aborted) return;
        const message =
          err instanceof Error ? err.message : 'Erro desconhecido ao carregar histórico.';
        toast.error('Não foi possível carregar o histórico do caso.');
        setState({ status: 'error', message });
      });

    return () => {
      mounted = false;
      ctrl.abort();
    };
  }, [caseId, retryToken]);

  // Agrupa por dia. Mantém ordem do backend (mais recente primeiro) dentro de
  // cada bucket. useMemo evita re-agrupar a cada render mesmo sem mudança.
  const grouped = useMemo(() => {
    if (state.status !== 'success') return null;
    const groups: Record<Bucket, CaseHistoryEntry[]> = {
      Hoje: [],
      Ontem: [],
      Anterior: [],
    };
    for (const e of state.entries) groups[bucketOf(e.edited_at)].push(e);
    return (['Hoje', 'Ontem', 'Anterior'] as const)
      .map((label) => ({ label, items: groups[label] }))
      .filter((g) => g.items.length > 0);
  }, [state]);

  return (
    <div
      className={`flex flex-col gap-4 ${className}`}
      style={{ color: 'var(--col-body)' }}
    >
      {state.status === 'loading' && <TimelineSkeleton />}

      {state.status === 'error' && (
        <ErrorState onRetry={() => setRetryToken((t) => t + 1)} />
      )}

      {state.status === 'success' && grouped && grouped.length === 0 && <EmptyState />}

      {state.status === 'success' &&
        grouped &&
        grouped.length > 0 &&
        grouped.map((group) => (
          <section key={group.label}>
            <header
              className="mb-1 border-b pb-1.5 text-[10.5px] font-extrabold uppercase tracking-wider"
              style={{
                color: 'var(--col-dim)',
                borderColor: 'var(--glass-inner-border)',
              }}
            >
              {group.label}
            </header>

            {/* Container relativo pra suportar a linha vertical da timeline */}
            <div className="relative">
              <div
                className="absolute bottom-3 left-[13px] top-3 w-[2px]"
                style={{ background: 'var(--col-divider)' }}
                aria-hidden
              />
              {group.items.map((entry, i) => (
                <TimelineEntry
                  // ID estável: combinação de timestamp + kind + (attachment id ou índice).
                  // Não há ID único de entry no contrato, então usamos esse fallback.
                  key={`${entry.edited_at}-${entry.kind}-${'attachment' in entry ? entry.attachment.id : i}`}
                  entry={entry}
                />
              ))}
            </div>
          </section>
        ))}
    </div>
  );
}

export default CaseHistoryTimeline;