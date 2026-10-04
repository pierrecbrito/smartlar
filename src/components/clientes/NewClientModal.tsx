import React, { useRef, useState } from 'react';
import { MapPin, Loader2, UserPlus, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { maskPhone } from '../../lib/utils';
import { maskCep, buscarCep, formatarEnderecoCompleto } from '../../lib/cep';
import { ModalPortal } from '../ModalPortal';

interface NewClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (novoCliente: any) => void;
  showToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => void;
}

export const NewClientModal: React.FC<NewClientModalProps> = ({ isOpen, onClose, onSuccess, showToast }) => {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');

  const [cep, setCep] = useState('');
  const [logradouro, setLogradouro] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('Recife');
  const [estado, setEstado] = useState('PE');
  const [pontoReferencia, setPontoReferencia] = useState('');
  const [loadingCep, setLoadingCep] = useState(false);
  const numeroInputRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const masked = maskCep(raw);
    setCep(masked);

    const clean = raw.replace(/\D/g, '');
    if (clean.length === 8) {
      setLoadingCep(true);
      try {
        const info = await buscarCep(clean);
        if (info && !info.erro) {
          if (info.logradouro) setLogradouro(info.logradouro);
          if (info.bairro) setBairro(info.bairro);
          if (info.localidade) setCidade(info.localidade);
          if (info.uf) setEstado(info.uf);
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

  const resetForm = () => {
    setNome('');
    setTelefone('');
    setEmail('');
    setCep('');
    setLogradouro('');
    setNumero('');
    setComplemento('');
    setBairro('');
    setCidade('Recife');
    setEstado('PE');
    setPontoReferencia('');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const cleanPhone = telefone.replace(/\D/g, '');
      if (cleanPhone.length < 10 || cleanPhone.length > 13) {
        throw new Error('O telefone deve ter entre 10 e 13 dígitos numéricos.');
      }

      if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        throw new Error('Por favor, informe um endereço de e-mail válido.');
      }

      const enderecoCompleto = formatarEnderecoCompleto({
        cep: cep.trim(),
        logradouro: logradouro.trim(),
        numero: numero.trim(),
        complemento: complemento.trim(),
        bairro: bairro.trim(),
        cidade: cidade.trim(),
        estado: estado.trim(),
      });

      if (!enderecoCompleto) {
        throw new Error('Informe o logradouro e número da instalação.');
      }

      const { data, error } = await supabase
        .from('clientes')
        .insert({
          nome: nome.trim(),
          telefone: cleanPhone,
          email: email.trim() || null,
          endereco: enderecoCompleto,
          cep: cep.trim() || null,
          logradouro: logradouro.trim() || null,
          numero: numero.trim() || null,
          complemento: complemento.trim() || null,
          bairro: bairro.trim() || null,
          cidade: cidade.trim() || 'Recife',
          estado: estado.trim() || 'PE',
          ponto_referencia: pontoReferencia.trim() || null,
        })
        .select(`
          *,
          pedidos:pedidos(id, numero_pedido, status, valor_total)
        `)
        .single();

      if (error) throw error;

      showToast('success', 'Cliente cadastrado com sucesso!');
      onSuccess(data);
      onClose();
      resetForm();
    } catch (err: any) {
      console.error('Erro ao criar cliente:', err);
      showToast('error', 'Erro ao salvar cliente', err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
        <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 max-h-[92vh] flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 bg-blue-600 border-b border-blue-700/60 text-white shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white shrink-0">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base leading-tight">
                  Cadastrar Novo Cliente
                </h3>
                <p className="text-xs text-blue-100 font-medium">
                  Adicione um novo cliente com endereço estruturado
                </p>
              </div>
            </div>
            <button
              onClick={() => { onClose(); resetForm(); }}
              className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleCreate} className="p-6 space-y-4 overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Marina Costa"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Telefone (WhatsApp) *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="(81) 99999-8888"
                  value={telefone}
                  onChange={(e) => setTelefone(maskPhone(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  E-mail (Opcional)
                </label>
                <input
                  type="email"
                  placeholder="marina@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Seção Endereço da Instalação */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  Endereço da Instalação
                </span>
                {loadingCep ? (
                  <span className="text-[11px] text-blue-600 font-bold flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Buscando CEP...
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400">Autocompleta via CEP</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    CEP *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="00000-000"
                    value={cep}
                    maxLength={9}
                    onChange={handleCepChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Número *
                  </label>
                  <input
                    ref={numeroInputRef}
                    type="text"
                    required
                    placeholder="Ex: 120 ou S/N"
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Logradouro (Rua / Av) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Rua das Flores"
                  value={logradouro}
                  onChange={(e) => setLogradouro(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Complemento
                  </label>
                  <input
                    type="text"
                    placeholder="Apto 302, Bloco B"
                    value={complemento}
                    onChange={(e) => setComplemento(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Bairro *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Boa Viagem"
                    value={bairro}
                    onChange={(e) => setBairro(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Cidade *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Recife"
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    UF *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={2}
                    placeholder="PE"
                    value={estado}
                    onChange={(e) => setEstado(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 uppercase text-center font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Ponto de Referência <span className="text-slate-400 font-normal">(para o técnico)</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Em frente à padaria / portão branco"
                  value={pontoReferencia}
                  onChange={(e) => setPontoReferencia(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => { onClose(); resetForm(); }}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-2xl shadow-xs cursor-pointer disabled:opacity-50"
              >
                {saving ? 'Cadastrando...' : 'Cadastrar Cliente'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
};
