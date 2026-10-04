import React from 'react';
import { useNovoPedido } from '../hooks/useNovoPedido';
import { ProductCatalog } from '../components/novo-pedido/ProductCatalog';
import { OrderEditPanel } from '../components/novo-pedido/OrderEditPanel';
import { OrderConfirmPanel } from '../components/novo-pedido/OrderConfirmPanel';
import { NewClientModal } from '../components/novo-pedido/NewClientModal';
import { OrcamentoPdfModal } from '../components/OrcamentoPdfModal';

interface NovoPedidoPageProps {
  onNavigate: (tab: any) => void;
}

export const NovoPedidoPage: React.FC<NovoPedidoPageProps> = ({ onNavigate }) => {
  const state = useNovoPedido();
  const { createdOrderPdfData, setCreatedOrderPdfData } = state;

  return (
    <div className="animate-fade-in space-y-6">
      {/* Grid Layout: Lado Esquerdo (CatÃ¡logo) + Lado Direito (Detalhes do Pedido) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <ProductCatalog state={state} />

        {/* LADO DIREITO: Painel "Detalhes do Pedido" (4 Colunas) */}
        <div className="w-full lg:col-span-4 lg:sticky lg:top-20">
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between min-h-[640px]">
            {state.detalhesMode === 'edicao' ? (
              <OrderEditPanel state={state} />
            ) : (
              <OrderConfirmPanel state={state} />
            )}
          </div>
        </div>
      </div>

      <NewClientModal state={state} />

      {/* Modal de Proposta Comercial em PDF e Envio via WhatsApp */}
      {createdOrderPdfData && (
        <OrcamentoPdfModal
          isOpen={Boolean(createdOrderPdfData)}
          onClose={() => setCreatedOrderPdfData(null)}
          pedido={createdOrderPdfData.pedido}
          cliente={createdOrderPdfData.cliente}
          itens={createdOrderPdfData.itens}
          descontoPercentual={createdOrderPdfData.descontoPercentual}
          observacoes={createdOrderPdfData.observacoes}
          formaPagamento={createdOrderPdfData.formaPagamento}
          secondaryActionLabel="Gerenciar Pedidos"
          onSecondaryAction={() => onNavigate('pedidos')}
        />
      )}
    </div>
  );
};