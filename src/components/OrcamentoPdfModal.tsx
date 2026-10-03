import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  X,
  Share2,
  Phone,
  Eye,
} from 'lucide-react';
import { ModalPortal } from './ModalPortal';
import { Pedido, Cliente, ItemPedido } from '../types/database';
import { formatCurrency, formatOrderCode, formatPhone } from '../lib/utils';
import {
  generateOrcamentoPdf,
  uploadOrcamentoPdfToSupabase,
  buildWhatsAppLink,
  PdfGenerationResult,
} from '../lib/pdfGenerator';
import { useToast } from './Toast';

export interface OrcamentoPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  pedido: Pedido;
  cliente: Cliente;
  itens: (ItemPedido & { produto?: { nome: string; categoria?: string; descricao?: string | null } })[];
  descontoPercentual?: number;
  observacoes?: string;
  formaPagamento?: string;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

export const OrcamentoPdfModal: React.FC<OrcamentoPdfModalProps> = ({
  isOpen,
  onClose,
  pedido,
  cliente,
  itens,
  descontoPercentual = 0,
  observacoes,
  formaPagamento,
  secondaryActionLabel,
  onSecondaryAction,
}) => {
  const [generating, setGenerating] = useState(true);
  const [pdfResult, setPdfResult] = useState<PdfGenerationResult | null>(null);
  const [publicUrl, setPublicUrl] = useState<string>('');

  const { showToast } = useToast();

  useEffect(() => {
    if (!isOpen) {
      setPdfResult(null);
      setPublicUrl('');
      return;
    }

    let isMounted = true;

    const processPdf = async () => {
      setGenerating(true);
      try {
        // 1. Gera o PDF estilizado com a paleta oficial do sistema
        const result = generateOrcamentoPdf({
          pedido,
          cliente,
          itens,
          descontoPercentual,
          observacoes,
          formaPagamento,
        });

        if (!isMounted) return;
        setPdfResult(result);
        setGenerating(false);

        // 2. Faz o upload em segundo plano para o link do WhatsApp
        const uploadRes = await uploadOrcamentoPdfToSupabase(
          pedido.id,
          pedido.numero_pedido,
          result.blob
        );

        if (!isMounted) return;
        if (uploadRes.isSupabaseHosted && uploadRes.publicUrl) {
          setPublicUrl(uploadRes.publicUrl);
        }
      } catch (err: any) {
        console.error('Erro ao gerar PDF:', err);
        if (isMounted) {
          setGenerating(false);
          showToast('error', 'Falha ao gerar proposta em PDF', err.message);
        }
      }
    };

    processPdf();

    return () => {
      isMounted = false;
    };
  }, [isOpen, pedido, cliente, itens]);

  if (!isOpen) return null;

  const orderCode = formatOrderCode(pedido);
  const finalTotal = pedido.valor_total || itens.reduce((acc, i) => acc + (i.subtotal || i.quantidade * i.preco_unitario), 0);

  const whatsAppUrl = buildWhatsAppLink({
    cliente,
    pedido,
    pdfUrl: publicUrl,
    itensCount: itens.length,
    valorTotal: finalTotal,
  });

  const handleDownloadPdf = () => {
    if (!pdfResult) return;
    pdfResult.doc.save(pdfResult.fileName);
    showToast('success', 'Download iniciado!', `Arquivo ${pdfResult.fileName} salvo com sucesso.`);
  };

  const handleViewPdf = () => {
    if (!pdfResult) return;
    const url = publicUrl || pdfResult.localUrl;
    window.open(url, '_blank');
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
          {/* Header com o azul do sistema no fundo e fontes brancas */}
          <div className="flex items-center justify-between px-6 py-4 bg-blue-600 border-b border-blue-700/60 text-white">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base leading-tight">
                  Proposta Comercial {orderCode}
                </h3>
                <p className="text-xs text-blue-100 font-medium">
                  Orçamento e proposta técnica da SmartLar
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            {/* Resumo Direto da Proposta */}
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Cliente:</span>
                <span className="font-bold text-slate-900">{cliente.nome}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Contato / WhatsApp:</span>
                <span className="font-mono text-slate-700 flex items-center gap-1 font-semibold">
                  <Phone className="w-3 h-3 text-emerald-600" />
                  {formatPhone(cliente.telefone)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Itens Inclusos:</span>
                <span className="font-bold text-slate-800">{itens.length} produto(s)</span>
              </div>
              <div className="flex justify-between items-center pt-2.5 border-t border-slate-200 font-extrabold text-sm">
                <span className="text-slate-700">Valor Total:</span>
                <span className="text-base font-extrabold text-slate-900">
                  {formatCurrency(finalTotal)}
                </span>
              </div>
            </div>

            {/* Ações Principais: WhatsApp, Visualizar e Baixar */}
            <div className="space-y-2 pt-1">
              {/* Botão de Enviar via WhatsApp */}
              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-xs hover:shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Enviar Orçamento via WhatsApp</span>
              </a>

              {/* Botões Secundários: Visualizar e Baixar PDF */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleViewPdf}
                  disabled={generating}
                  className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-600" />
                  <span>Visualizar PDF</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={generating}
                  className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>Baixar Arquivo</span>
                </button>
              </div>
            </div>

            {/* Rodapé do Modal */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Fechar
              </button>

              {onSecondaryAction && secondaryActionLabel && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSecondaryAction();
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold cursor-pointer transition-colors shadow-xs"
                >
                  {secondaryActionLabel} ➔
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
