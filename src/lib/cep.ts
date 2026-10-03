// Utilitário de busca e formatação de endereços e CEP (ViaCEP + GPS)

export interface ViaCepResponse {
  cep?: string;
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  ibge?: string;
  gia?: string;
  ddd?: string;
  siafi?: string;
  erro?: boolean;
}

export interface EnderecoEstruturado {
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  ponto_referencia?: string;
}

/**
 * Aplica máscara de CEP brasileiro (00000-000)
 */
export const maskCep = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

/**
 * Consulta a API pública do ViaCEP com timeout e tratamento de erros
 */
export const buscarCep = async (cep: string): Promise<ViaCepResponse | null> => {
  const clean = cep.replace(/\D/g, '');
  if (clean.length !== 8) return null;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) return null;
    const data: ViaCepResponse = await res.json();
    if (data.erro) return null;

    return data;
  } catch (err) {
    console.warn('Falha ao consultar ViaCEP:', err);
    return null;
  }
};

/**
 * Formata um endereço completo amigável a partir dos campos estruturados
 */
export const formatarEnderecoCompleto = (end: Partial<EnderecoEstruturado>): string => {
  const partes: string[] = [];

  const ruaNum = [end.logradouro?.trim(), end.numero?.trim()].filter(Boolean).join(', ');
  if (ruaNum) partes.push(ruaNum);

  if (end.complemento?.trim()) {
    partes.push(end.complemento.trim());
  }

  if (end.bairro?.trim()) {
    partes.push(end.bairro.trim());
  }

  const cidadeUf = [end.cidade?.trim(), end.estado?.trim()].filter(Boolean).join(' - ');
  if (cidadeUf) partes.push(cidadeUf);

  if (end.cep?.trim()) {
    partes.push(`CEP: ${maskCep(end.cep.trim())}`);
  }

  return partes.join(', ');
};

/**
 * Formata o endereço para exibição na listagem de clientes,
 * ocultando intencionalmente o complemento e a referência.
 */
export const formatarEnderecoListagem = (cliente: {
  logradouro?: string | null;
  numero?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  endereco?: string | null;
}): string => {
  if (cliente.logradouro) {
    const partes: string[] = [];
    const ruaNum = [cliente.logradouro?.trim(), cliente.numero?.trim()].filter(Boolean).join(', ');
    if (ruaNum) partes.push(ruaNum);
    if (cliente.bairro?.trim()) partes.push(cliente.bairro.trim());
    const cidadeUf = [cliente.cidade?.trim(), cliente.estado?.trim()].filter(Boolean).join(' - ');
    if (cidadeUf) partes.push(cidadeUf);
    return partes.join(', ');
  }

  return cliente.endereco || 'Endereço não informado';
};

/**
 * Gera URL de busca no Google Maps
 */
export const getGoogleMapsUrl = (endereco: string): string => {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco.trim())}`;
};

/**
 * Gera URL de navegação no Waze
 */
export const getWazeUrl = (endereco: string): string => {
  return `https://waze.com/ul?q=${encodeURIComponent(endereco.trim())}&navigate=yes`;
};
