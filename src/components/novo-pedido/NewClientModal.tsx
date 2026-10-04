import React from 'react';
import {
  UserPlus,
  X,
  MapPin,
  Loader2,
} from 'lucide-react';
import { maskPhone } from '../../lib/utils';
import { ModalPortal } from '../ModalPortal';
import { NovoPedidoState } from '../../hooks/useNovoPedido';

interface Props {
  state: NovoPedidoState;
}

export const NewClientModal: React.FC<Props> = ({ state }) => {
  const { isNewClientModalOpen, setIsNewClientModalOpen, newClientNome, setNewClientNome, newClientTelefone, setNewClientTelefone, newClientEmail, setNewClientEmail, newClientCep, newClientLogradouro, setNewClientLogradouro, newClientNumero, setNewClientNumero, newClientComplemento, setNewClientComplemento, newClientBairro, setNewClientBairro, newClientCidade, setNewClientCidade, newClientEstado, setNewClientEstado, newClientPontoReferencia, setNewClientPontoReferencia, loadingClientCep, newClientNumeroRef, savingClient, handleNewClientCepChange, resetNewClientForm, handleCreateNewClient } = state;

  return (
    <>
      {/* Modal Cadastro Rápido de Cliente */}
      {isNewClientModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 max-h-[92vh] flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 bg-blue-600 border-b border-blue-700/60 text-white shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white shrink-0">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base leading-tight">Cadastrar Novo Cliente</h3>
                    <p className="text-xs text-blue-100 font-medium">Vinculação imediata com endereço estruturado</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsNewClientModalOpen(false);
                    resetNewClientForm();
                  }}
                  className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateNewClient} className="p-6 space-y-4 overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Carlos Eduardo"
                      value={newClientNome}
                      onChange={(e) => setNewClientNome(e.target.value)}
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
                      value={newClientTelefone}
                      onChange={(e) => setNewClientTelefone(maskPhone(e.target.value))}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      E-mail (Opcional)
                    </label>
                    <input
                      type="email"
                      placeholder="cliente@exemplo.com"
                      value={newClientEmail}
                      onChange={(e) => setNewClientEmail(e.target.value)}
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
                    {loadingClientCep ? (
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
                        value={newClientCep}
                        maxLength={9}
                        onChange={handleNewClientCepChange}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Número *
                      </label>
                      <input
                        ref={newClientNumeroRef}
                        type="text"
                        required
                        placeholder="Ex: 120 ou S/N"
                        value={newClientNumero}
                        onChange={(e) => setNewClientNumero(e.target.value)}
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
                      value={newClientLogradouro}
                      onChange={(e) => setNewClientLogradouro(e.target.value)}
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
                        value={newClientComplemento}
                        onChange={(e) => setNewClientComplemento(e.target.value)}
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
                        value={newClientBairro}
                        onChange={(e) => setNewClientBairro(e.target.value)}
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
                        value={newClientCidade}
                        onChange={(e) => setNewClientCidade(e.target.value)}
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
                        value={newClientEstado}
                        onChange={(e) => setNewClientEstado(e.target.value.toUpperCase())}
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
                      value={newClientPontoReferencia}
                      onChange={(e) => setNewClientPontoReferencia(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewClientModalOpen(false);
                      resetNewClientForm();
                    }}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingClient}
                    className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-2xl shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {savingClient ? 'Salvando...' : 'Cadastrar e Selecionar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}
    </>
  );
};