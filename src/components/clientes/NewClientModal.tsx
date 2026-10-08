import React, { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MapPin, Loader2, UserPlus, X, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { maskPhone } from '../../lib/utils';
import { maskCep, buscarCep, formatarEnderecoCompleto } from '../../lib/cep';
import { ModalPortal } from '../ModalPortal';
import { clienteSchema, ClienteFormData } from '../../lib/schemas';
import { Cliente } from '../../types/database';

interface NewClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (novoCliente: Cliente) => void;
  showToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => void;
}

export const NewClientModal: React.FC<NewClientModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  showToast,
}) => {
  const [loadingCep, setLoadingCep] = useState(false);
  const numeroInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      nome: '',
      telefone: '',
      email: '',
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: 'Recife',
      estado: 'PE',
      ponto_referencia: '',
    },
  });

  const cepValue = watch('cep');
  const telefoneValue = watch('telefone');

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskPhone(e.target.value);
    setValue('telefone', masked, { shouldValidate: true });
  };

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const masked = maskCep(raw);
    setValue('cep', masked, { shouldValidate: true });

    const clean = raw.replace(/\D/g, '');
    if (clean.length === 8) {
      setLoadingCep(true);
      try {
        const info = await buscarCep(clean);
        if (info && !info.erro) {
          if (info.logradouro) setValue('logradouro', info.logradouro, { shouldValidate: true });
          if (info.bairro) setValue('bairro', info.bairro, { shouldValidate: true });
          if (info.localidade) setValue('cidade', info.localidade, { shouldValidate: true });
          if (info.uf) setValue('estado', info.uf, { shouldValidate: true });
          showToast('info', 'Endereço localizado via CEP', `${info.logradouro || ''}, ${info.bairro || ''}`);
          setTimeout(() => {
            numeroInputRef.current?.focus();
          }, 100);
        } else {
          showToast('warning', 'CEP não encontrado', 'Preencha o logradouro e bairro manualmente.');
        }
      } catch (err) {
        console.error('Erro ao buscar CEP:', err);
      } finally {
        setLoadingCep(false);
      }
    }
  };

  const onSubmit = async (data: ClienteFormData) => {
    try {
      const cleanPhone = data.telefone.replace(/\D/g, '');

      const enderecoCompleto = formatarEnderecoCompleto({
        cep: data.cep?.trim() || '',
        logradouro: data.logradouro?.trim() || '',
        numero: data.numero?.trim() || '',
        complemento: data.complemento?.trim() || '',
        bairro: data.bairro?.trim() || '',
        cidade: data.cidade?.trim() || 'Recife',
        estado: data.estado?.trim() || 'PE',
      });

      if (!enderecoCompleto) {
        throw new Error('Informe o logradouro e número da instalação.');
      }

      const { data: createdClient, error } = await supabase
        .from('clientes')
        .insert({
          nome: data.nome.trim(),
          telefone: cleanPhone,
          email: data.email?.trim() || null,
          endereco: enderecoCompleto,
          cep: data.cep?.trim() || null,
          logradouro: data.logradouro?.trim() || null,
          numero: data.numero?.trim() || null,
          complemento: data.complemento?.trim() || null,
          bairro: data.bairro?.trim() || null,
          cidade: data.cidade?.trim() || 'Recife',
          estado: data.estado?.trim() || 'PE',
          ponto_referencia: data.ponto_referencia?.trim() || null,
        })
        .select('*')
        .single();

      if (error) throw error;

      showToast('success', 'Cliente cadastrado com sucesso!');
      onSuccess(createdClient as Cliente);
      reset();
      onClose();
    } catch (err: unknown) {
      console.error('Erro ao criar cliente:', err);
      const msg = err instanceof Error ? err.message : 'Falha ao salvar cliente.';
      showToast('error', 'Erro ao salvar cliente', msg);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
        <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 max-h-[92vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-blue-600 border-b border-blue-700/60 text-white shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white shrink-0">
                <UserPlus className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base leading-tight">Cadastrar Novo Cliente</h3>
                <p className="text-xs text-blue-100 font-medium">Validação estrita com endereço estruturado</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                reset();
                onClose();
              }}
              className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 overflow-y-auto flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Nome */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Carlos Eduardo"
                  {...register('nome')}
                  className={`w-full px-4 py-2.5 bg-slate-50 border rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none ${
                    errors.nome ? 'border-rose-300 ring-2 ring-rose-200/50' : 'border-slate-200 focus:border-blue-500'
                  }`}
                />
                {errors.nome && (
                  <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.nome.message}
                  </p>
                )}
              </div>

              {/* Telefone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  WhatsApp / Celular *
                </label>
                <input
                  type="text"
                  placeholder="(81) 98888-7777"
                  value={telefoneValue || ''}
                  onChange={handlePhoneChange}
                  className={`w-full px-4 py-2.5 bg-slate-50 border rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none font-mono ${
                    errors.telefone ? 'border-rose-300 ring-2 ring-rose-200/50' : 'border-slate-200 focus:border-blue-500'
                  }`}
                />
                {errors.telefone && (
                  <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.telefone.message}
                  </p>
                )}
              </div>

              {/* E-mail */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  E-mail (opcional)
                </label>
                <input
                  type="email"
                  placeholder="cliente@email.com"
                  {...register('email')}
                  className={`w-full px-4 py-2.5 bg-slate-50 border rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none ${
                    errors.email ? 'border-rose-300 ring-2 ring-rose-200/50' : 'border-slate-200 focus:border-blue-500'
                  }`}
                />
                {errors.email && (
                  <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Divisor Endereço */}
              <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  Endereço da Instalação
                </span>
              </div>

              {/* CEP */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  CEP (Autopreenchimento)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="50000-000"
                    maxLength={9}
                    value={cepValue || ''}
                    onChange={handleCepChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                  {loadingCep && (
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs text-blue-600 font-semibold bg-white px-2 py-1 rounded-lg">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Buscando...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Logradouro */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Rua / Avenida *
                </label>
                <input
                  type="text"
                  placeholder="Rua das Flores"
                  {...register('logradouro')}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Número */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Número *
                </label>
                <input
                  type="text"
                  placeholder="123"
                  {...register('numero')}
                  ref={(e) => {
                    register('numero').ref(e);
                    (numeroInputRef as any).current = e;
                  }}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              {/* Complemento */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Complemento
                </label>
                <input
                  type="text"
                  placeholder="Apto 402, Bloco B"
                  {...register('complemento')}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Bairro */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Bairro
                </label>
                <input
                  type="text"
                  placeholder="Boa Viagem"
                  {...register('bairro')}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Cidade / Estado */}
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Cidade
                  </label>
                  <input
                    type="text"
                    placeholder="Recife"
                    {...register('cidade')}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    UF
                  </label>
                  <input
                    type="text"
                    maxLength={2}
                    placeholder="PE"
                    {...register('estado')}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 uppercase font-mono text-center"
                  />
                </div>
              </div>

              {/* Ponto de Referência */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Ponto de Referência para a Equipe Técnica
                </label>
                <input
                  type="text"
                  placeholder="Ex: Próximo à padaria diplomata, portão branco"
                  {...register('ponto_referencia')}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  reset();
                  onClose();
                }}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-2xl shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <span>Cadastrar Cliente</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
};
