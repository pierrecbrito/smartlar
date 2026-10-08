import { z } from 'zod';

export const clienteSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(3, 'O nome deve ter no mínimo 3 caracteres')
    .max(120, 'O nome deve ter no máximo 120 caracteres'),
  telefone: z
    .string()
    .trim()
    .refine((val) => {
      const clean = val.replace(/\D/g, '');
      return clean.length >= 10 && clean.length <= 13;
    }, 'Telefone inválido. Informe o DDD e o número completo (10 ou 11 dígitos)'),
  email: z
    .string()
    .trim()
    .email('Formato de e-mail inválido')
    .optional()
    .or(z.literal('')),
  cep: z
    .string()
    .trim()
    .optional()
    .refine((val) => {
      if (!val) return true;
      const clean = val.replace(/\D/g, '');
      return clean.length === 8;
    }, 'O CEP deve ter 8 dígitos'),
  logradouro: z.string().trim().optional(),
  numero: z.string().trim().optional(),
  complemento: z.string().trim().optional(),
  bairro: z.string().trim().optional(),
  cidade: z.string().trim().min(2, 'Informe a cidade'),
  estado: z.string().trim().length(2, 'UF com 2 letras'),
  ponto_referencia: z.string().trim().optional(),
});

export type ClienteFormData = z.infer<typeof clienteSchema>;

export const produtoSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(2, 'O nome do equipamento deve ter pelo menos 2 caracteres'),
  categoria: z
    .string()
    .trim()
    .min(2, 'Selecione ou informe a categoria'),
  preco_unitario: z
    .number({ invalid_type_error: 'Informe um valor numérico válido' })
    .min(0.01, 'O preço deve ser maior que zero (R$ 0,01)'),
  descricao: z.string().trim().optional(),
  ativo: z.boolean().optional(),
});

export type ProdutoFormData = z.infer<typeof produtoSchema>;
