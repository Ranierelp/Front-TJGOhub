// =============================================================================
// CONCEITO 1: O que é Zod e para que serve
//
// Zod é uma biblioteca de validação de schemas para TypeScript.
// Você define o formato esperado de um dado, e o Zod:
//   1. Valida em runtime (como Django Forms ou DRF Serializers)
//   2. Infere o tipo TypeScript automaticamente (z.infer<typeof schema>)
//
// Paralelo Django: Zod é como uma combinação de:
//   • Django Forms    → valida dados do formulário
//   • DRF Serializers → valida e descreve o formato dos dados
//
// No projeto, o Zod é conectado ao react-hook-form via zodResolver,
// que roda a validação automaticamente quando o formulário é submetido.
// =============================================================================

import { z } from "zod";

import { UserRole } from "@/lib/types";

// =============================================================================
// CONCEITO 2: Construindo schemas com z.object()
//
// z.object({ campo: z.tipo().validador() }) define a forma de um objeto.
//
// Encadeamento (chaining): validadores são encadeados com ponto:
//   z.string()            → deve ser string
//   z.string().min(8)     → string + mínimo 8 caracteres
//   z.string().optional() → pode ser undefined
//   z.string().nullable() → pode ser null
//
// NOTA — Zod v4: mensagens de erro agora usam objeto { error: "..." }
// em vez de string direta, e .regex() virou .check(z.regex(...)):
//
//   Zod v3: z.string().email("mensagem")
//   Zod v4: z.string().email({ error: "mensagem" })
//
//   Zod v3: z.string().regex(/p/, "mensagem")
//   Zod v4: z.string().check(z.regex(/p/, "mensagem"))
// =============================================================================

// --- Schema para CRIAÇÃO de usuário (POST /api/v1/users) ---
export const userCreationSchema = z.object({
  name: z.string().trim().nullable().optional(),
  email: z.string().email({ error: "Formato de e-mail inválido." }).min(1, "O e-mail é obrigatório."),
  password: z.string().min(8, "A senha deve ter no mínimo 8 caracteres."),
  role: z.nativeEnum(UserRole).default(UserRole.USER),
});

// --- Schema para ATUALIZAÇÃO de usuário (PATCH /api/users/[id]) ---
export const userUpdateSchema = z.object({
  name: z.string().trim().optional(),
  email: z.string().email({ error: "Formato de e-mail inválido." }).optional(),
});

// --- Schema para LOGIN ---
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "O e-mail é obrigatório.")
    .max(254, "E-mail muito longo."),
  password: z
    .string()
    .min(6, "A senha deve ter pelo menos 6 caracteres.")
    .max(128, "Senha muito longa."),
});

// =============================================================================
// CONCEITO 3: .refine() — validação cruzada entre campos
//
// .refine() adiciona uma regra de validação CUSTOMIZADA que o Zod não tem
// nativamente — como comparar dois campos entre si.
//
// Sintaxe: .refine(fn, { message: "...", path: ["campo"] })
//   fn    → função que recebe o objeto inteiro e retorna true/false
//   path  → em qual campo colocar o erro (para o react-hook-form saber)
//
// Paralelo Django Forms:
//   def clean(self):
//       if self.cleaned_data['password1'] != self.cleaned_data['password2']:
//           raise ValidationError("As senhas não coincidem.")
// =============================================================================

// --- Schema para REGISTRO ---
// Campos espelhados do UserRegisterSerializer do backend:
//   first_name, last_name, email, password1, password2, terms
//
// IMPORTANTE: no schema Zod usamos camelCase (firstName, lastName)
// por convenção TypeScript. Na hora de enviar para a API, o authStore
// converte para snake_case (first_name, last_name) — que é o que o Django espera.
export const registerSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(2, "Nome deve ter pelo menos 2 caracteres.")
      .max(50, "Nome muito longo."),
    lastName: z
      .string()
      .trim()
      .min(2, "Sobrenome deve ter pelo menos 2 caracteres.")
      .max(50, "Sobrenome muito longo."),
    email: z
      .string()
      .email({ error: "Formato de e-mail inválido." })
      .max(254, "E-mail muito longo."),
    password1: z
      .string()
      .min(8, "A senha deve ter no mínimo 8 caracteres.")
      .max(128, "Senha muito longa.")
      // Zod v4: .check(z.regex(...)) substitui o depreciado .regex(...)
      .check(z.regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "A senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número.",
      )),
    password2: z.string().min(1, "Confirme sua senha."),
    // z.boolean() + .refine() garante que o checkbox foi marcado
    terms: z
      .boolean()
      .refine((val) => val === true, {
        message: "Você deve aceitar os termos e condições.",
      }),
  })
  // Validação cruzada: password2 deve ser idêntico a password1
  .refine((data) => data.password1 === data.password2, {
    message: "As senhas não coincidem.",
    path: ["password2"],
  });

// --- Schema para PERFIL DO USUÁRIO (Settings) ---
export const userProfileSchema = z.object({
  name: z
    .string()
    .min(2, "O nome deve ter pelo menos 2 caracteres.")
    .max(50, "O nome não pode ter mais de 50 caracteres.")
    .check(z.regex(/^[a-zA-ZÀ-ÿ\s]+$/, "O nome deve conter apenas letras e espaços.")),
  email: z
    .string()
    .email({ error: "Formato de e-mail inválido." })
    .max(254, "E-mail muito longo."),
});

// --- Schema para ALTERAÇÃO DE SENHA ---
export const passwordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(6, "A senha deve ter pelo menos 6 caracteres."),
    newPassword: z
      .string()
      .min(8, "A nova senha deve ter no mínimo 8 caracteres.")
      .max(128, "Senha muito longa.")
      .check(z.regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "A senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número.",
      )),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

// --- Schema para FORMULÁRIO DE PERFIL (sem campo de email) ---
export const profileFormSchema = z.object({
  name: z
    .string()
    .min(2, "O nome deve ter pelo menos 2 caracteres.")
    .max(50, "O nome não pode ter mais de 50 caracteres.")
    .check(z.regex(/^[a-zA-ZÀ-ÿ\s]+$/, "O nome deve conter apenas letras e espaços.")),
  // Zod v4: .check(z.url(...)) substitui .url("...") — mesmo padrão do .regex()
  imageUrl: z.string().check(z.url({ error: "Deve ser uma URL válida." })).optional().nullable(),
});

// =============================================================================
// CONCEITO 4: z.infer<typeof schema> — tipos derivados automaticamente
//
// Em vez de criar uma interface TypeScript manualmente E um schema Zod
// separado (duplicando trabalho), o Zod infere o tipo a partir do schema.
//
// z.infer<typeof registerSchema> gera automaticamente:
//   { email: string; password1: string; password2: string; terms: boolean }
//
// Vantagem: se você adicionar um campo no schema, o tipo se atualiza junto.
// Sem sincronização manual — Single Source of Truth.
// =============================================================================
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type PasswordFormData = z.infer<typeof passwordSchema>;
export type UserProfileFormData = z.infer<typeof userProfileSchema>;
export type ProfileFormData = z.infer<typeof profileFormSchema>;
