import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from './supabase';
import { Pedido, Cliente, ItemPedido } from '../types/database';
import { formatCurrency, formatDate, formatPhone, formatOrderCode } from './utils';

export interface GeneratePdfOptions {
  pedido: Pedido;
  cliente: Cliente;
  itens: (ItemPedido & { produto?: { nome: string; categoria?: string; descricao?: string | null } })[];
  descontoPercentual?: number;
  observacoes?: string;
  formaPagamento?: string;
}

export interface PdfGenerationResult {
  doc: jsPDF;
  blob: Blob;
  fileName: string;
  localUrl: string;
}

export interface UploadPdfResult {
  publicUrl: string;
  isSupabaseHosted: boolean;
  error?: string;
}

// Cores Oficiais do Sistema SmartLar (espelha tailwind.config.js)
const SYSTEM_COLORS = {
  navyBrand: [9, 13, 22] as [number, number, number],        // #090d16
  blue600: [20, 61, 115] as [number, number, number],        // #143d73 (Azul Primário da Marca)
  blue500: [42, 108, 184] as [number, number, number],       // #2a6cb8 (Azul Médio)
  blue300: [148, 184, 224] as [number, number, number],      // #94b8e0 (Azul Claro)
  blue200: [192, 212, 237] as [number, number, number],      // #c0d4ed (Borda Azul Suave)
  blue50: [240, 244, 250] as [number, number, number],       // #f0f4fa (Fundo Azul Suave)
  slate900: [15, 23, 42] as [number, number, number],        // #0f172a
  slate700: [51, 65, 85] as [number, number, number],        // #334155
  slate500: [100, 116, 139] as [number, number, number],     // #64748b
  slate200: [226, 232, 240] as [number, number, number],     // #e2e8f0
  slate50: [248, 250, 252] as [number, number, number],      // #f8fafc
  white: [255, 255, 255] as [number, number, number],
  emerald: [16, 185, 129] as [number, number, number],
};

/**
 * Gera um PDF altamente estilizado e profissional para orçamentos e propostas comerciais da SmartLar.
 */
export function generateOrcamentoPdf({
  pedido,
  cliente,
  itens,
  descontoPercentual = 0,
  observacoes,
  formaPagamento,
}: GeneratePdfOptions): PdfGenerationResult {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // 1. Barra de Topo Corporativa Elegante (Navy oficial: #090d16)
  doc.setFillColor(...SYSTEM_COLORS.navyBrand);
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Detalhe azul luminoso da marca (Azul oficial: #143d73)
  doc.setFillColor(...SYSTEM_COLORS.blue600);
  doc.rect(0, 28, pageWidth, 2, 'F');

  // Nome da Empresa e Tagline
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('SMARTLAR', margin, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...SYSTEM_COLORS.blue300);
  doc.text('AUTOMAÇÃO & SEGURANÇA RESIDENCIAL', margin, 18);
  doc.setTextColor(203, 213, 225);
  doc.setFontSize(7);
  doc.text('Soluções inteligentes para um lar conectado e seguro', margin, 23);

  // Contato no Topo Direito
  doc.setTextColor(226, 232, 240);
  doc.setFontSize(7.5);
  doc.text('contato@smartlar.com.br', pageWidth - margin, 12, { align: 'right' });
  doc.text('(81) 98765-4321 • smartlar.com.br', pageWidth - margin, 17, { align: 'right' });
  doc.text('Recife - PE', pageWidth - margin, 22, { align: 'right' });

  // 2. Título do Documento e Dados do Orçamento
  let currentY = 36;

  // Caixa de Identificação do Orçamento
  const orderNumStr = formatOrderCode(pedido);
  const dataEmissao = formatDate(pedido.created_at || new Date().toISOString());

  // Data de validade (15 dias)
  const validadeDate = new Date(pedido.created_at ? new Date(pedido.created_at) : new Date());
  validadeDate.setDate(validadeDate.getDate() + 15);
  const dataValidade = formatDate(validadeDate.toISOString());

  // Card do Orçamento (Direita) - Usando azul oficial #f0f4fa e borda #c0d4ed
  const cardWidth = 72;
  const cardX = pageWidth - margin - cardWidth;
  const clientCardWidth = cardX - margin - 4;
  const maxEnderecoWidth = clientCardWidth - 8;

  // Quebra e cálculo de linhas para o endereço completo do cliente
  const enderecoTexto = cliente.endereco ? cliente.endereco : 'Endereço não informado';
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const enderecoLinhas: string[] = doc.splitTextToSize(`Local de Instalação: ${enderecoTexto}`, maxEnderecoWidth);
  const enderecoLineHeight = 3.6;

  // Altura dinâmica de ambos os cards para que o endereço nunca seja cortado
  const clientNeededHeight = 17 + (enderecoLinhas.length * enderecoLineHeight) + 3.5;
  const cardHeight = Math.max(26, clientNeededHeight);

  doc.setFillColor(...SYSTEM_COLORS.blue50);
  doc.setDrawColor(...SYSTEM_COLORS.blue200);
  doc.roundedRect(cardX, currentY, cardWidth, cardHeight, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...SYSTEM_COLORS.blue600); // Azul primário oficial
  doc.text(`PROPOSTA COMERCIAL ${orderNumStr}`, cardX + 4, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...SYSTEM_COLORS.slate700);
  doc.text(`Data de Emissão:`, cardX + 4, currentY + 12);
  doc.setFont('helvetica', 'bold');
  doc.text(dataEmissao, cardX + cardWidth - 4, currentY + 12, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.text(`Validade da Proposta:`, cardX + 4, currentY + 17);
  doc.setFont('helvetica', 'bold');
  doc.text(`${dataValidade} (15 dias)`, cardX + cardWidth - 4, currentY + 17, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.text(`Status do Pedido:`, cardX + 4, currentY + 22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...SYSTEM_COLORS.blue600);
  doc.text((pedido.status || 'orcamento').toUpperCase(), cardX + cardWidth - 4, currentY + 22, { align: 'right' });

  // 3. Dados do Cliente (Esquerda)
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.roundedRect(margin, currentY, clientCardWidth, cardHeight, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('DADOS DO CLIENTE', margin + 4, currentY + 5.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(cliente.nome || 'Cliente', margin + 4, currentY + 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  const telFormatado = formatPhone(cliente.telefone);
  const emailFormatado = cliente.email ? ` • ${cliente.email}` : '';
  doc.text(`Tel: ${telFormatado}${emailFormatado}`, margin + 4, currentY + 16);

  let currentEndLineY = currentY + 20.5;
  enderecoLinhas.forEach((linha) => {
    doc.text(linha, margin + 4, currentEndLineY);
    currentEndLineY += enderecoLineHeight;
  });

  currentY += cardHeight + 8;

  // 4. Tabela de Equipamentos e Dispositivos (com jspdf-autotable)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('EQUIPAMENTOS E DISPOSITIVOS INCLUSOS', margin, currentY);

  const tableBody = itens.map((item, index) => {
    const nome = item.produto?.nome || 'Equipamento de Automação';
    const categoria = item.produto?.categoria ? ` (${item.produto.categoria})` : '';
    const desc = item.produto?.descricao ? `\n${item.produto.descricao}` : '';
    return [
      String(index + 1),
      `${nome}${categoria}${desc}`,
      String(item.quantidade),
      formatCurrency(item.preco_unitario),
      formatCurrency(item.subtotal || item.quantidade * item.preco_unitario),
    ];
  });

  autoTable(doc, {
    startY: currentY + 3,
    head: [['#', 'Item / Descrição', 'Qtd', 'Preço Unitário', 'Subtotal']],
    body: tableBody,
    theme: 'plain',
    margin: { left: margin, right: margin },
    headStyles: {
      fillColor: SYSTEM_COLORS.blue600,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 2.5,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
      cellPadding: 2.5,
      lineColor: [241, 245, 249],
      lineWidth: 0.2,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 14, halign: 'center' },
      3: { cellWidth: 26, halign: 'right' },
      4: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
    },
  });

  // Posição final após a tabela
  const finalTableY = (doc as any).lastAutoTable.finalY + 4;
  currentY = finalTableY;

  // 5. Bloco de Totais e Condições Comerciais
  const totalSubtotal = itens.reduce((acc, i) => acc + (i.subtotal || i.quantidade * i.preco_unitario), 0);
  const valorTotalFinal = pedido.valor_total || totalSubtotal;
  const valorDescontoCalc = Math.max(0, totalSubtotal - valorTotalFinal);

  const totalsBoxWidth = 80;
  const totalsBoxX = pageWidth - margin - totalsBoxWidth;

  // Caixa de Totais (Direita)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(totalsBoxX, currentY, totalsBoxWidth, valorDescontoCalc > 0 ? 30 : 24, 3, 3, 'FD');

  let totalLineY = currentY + 5.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Subtotal dos Itens:', totalsBoxX + 4, totalLineY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(formatCurrency(totalSubtotal), totalsBoxX + totalsBoxWidth - 4, totalLineY, { align: 'right' });

  if (valorDescontoCalc > 0) {
    totalLineY += 5.5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(16, 185, 129); // Verde
    const pctDesc = descontoPercentual > 0 ? ` (${descontoPercentual}%)` : '';
    doc.text(`Desconto Comercial${pctDesc}:`, totalsBoxX + 4, totalLineY);
    doc.setFont('helvetica', 'bold');
    doc.text(`- ${formatCurrency(valorDescontoCalc)}`, totalsBoxX + totalsBoxWidth - 4, totalLineY, { align: 'right' });
  }

  // Linha divisória
  totalLineY += 4;
  doc.setDrawColor(203, 213, 225);
  doc.line(totalsBoxX + 4, totalLineY, totalsBoxX + totalsBoxWidth - 4, totalLineY);

  // Valor Total em Destaque (com azul oficial do sistema)
  totalLineY += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('TOTAL DA PROPOSTA:', totalsBoxX + 4, totalLineY);
  doc.setFontSize(12);
  doc.setTextColor(...SYSTEM_COLORS.blue600); // Azul oficial da marca
  doc.text(formatCurrency(valorTotalFinal), totalsBoxX + totalsBoxWidth - 4, totalLineY, { align: 'right' });

  // Condições de Pagamento e Observações (Lado Esquerdo)
  const infoBoxWidth = totalsBoxX - margin - 4;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, infoBoxWidth, valorDescontoCalc > 0 ? 30 : 24, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('CONDIÇÕES E FORMAS DE PAGAMENTO', margin + 4, currentY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  const formaPagtoTexto = formaPagamento || pedido.forma_pagamento || 'pix';
  const formaFormatada =
    formaPagtoTexto === 'pix'
      ? 'PIX à vista (Ativação e agendamento imediato)'
      : formaPagtoTexto === 'cartao_credito'
      ? 'Cartão de Crédito em até 12x sem juros'
      : formaPagtoTexto === 'boleto'
      ? 'Boleto Bancário com vencimento em 3 dias'
      : 'A combinar';

  doc.text(`• Condição Selecionada: ${formaFormatada}`, margin + 4, currentY + 11);
  doc.text('• Incluso: Configuração completa, testes de rede e garantia.', margin + 4, currentY + 16);
  if (valorDescontoCalc > 0) {
    doc.text('• Desconto comercial exclusivo para esta cotação.', margin + 4, currentY + 21);
  }

  currentY += (valorDescontoCalc > 0 ? 30 : 24) + 6;

  // 6. Observações Adicionais (se houver)
  const finalObs = observacoes || pedido.observacoes;
  if (finalObs && currentY < pageHeight - 50) {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, currentY, contentWidth, 14, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('OBSERVAÇÕES TÉCNICAS E COMERCIAIS:', margin + 4, currentY + 4.5);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(51, 65, 85);
    const obsTruncada = finalObs.length > 180 ? `${finalObs.slice(0, 177)}...` : finalObs;
    doc.text(obsTruncada, margin + 4, currentY + 9.5);

    currentY += 18;
  }

  // 7. Termos de Garantia e Suporte (Box Inferior)
  if (currentY < pageHeight - 38) {
    doc.setFillColor(...SYSTEM_COLORS.blue50);
    doc.setDrawColor(...SYSTEM_COLORS.blue200);
    doc.roundedRect(margin, currentY, contentWidth, 14, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...SYSTEM_COLORS.blue600);
    doc.text('GARANTIA E SUPORTE TÉCNICO SMARTLAR', margin + 4, currentY + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    doc.text(
      'Todos os equipamentos contam com 12 meses de garantia contra defeitos de fabricação. Mão de obra de instalação possui 90 dias de garantia total com atendimento prioritário e pós-venda especializado.',
      margin + 4,
      currentY + 9,
      { maxWidth: contentWidth - 8 }
    );
  }

  // 8. Rodapé Fixo
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'SmartLar Tecnologia Residencial Ltda • CNPJ: 00.000.000/0001-00 • Documento emitido eletronicamente',
    margin,
    pageHeight - 7
  );
  doc.text('Página 1 de 1', pageWidth - margin, pageHeight - 7, { align: 'right' });

  // Gera Blob e nomes
  const cleanOrderNum = pedido.numero_pedido ? String(pedido.numero_pedido) : pedido.id.slice(0, 8);
  const fileName = `orcamento-smartlar-${cleanOrderNum}.pdf`;
  const blob = doc.output('blob');
  const localUrl = URL.createObjectURL(blob);

  return {
    doc,
    blob,
    fileName,
    localUrl,
  };
}

/**
 * Faz o upload do PDF gerado para o Supabase Storage no bucket 'orcamentos'.
 * Se o bucket não estiver criado ou falhar, retorna o fallback transparente.
 */
export async function uploadOrcamentoPdfToSupabase(
  pedidoId: string,
  numeroPedido: number | undefined,
  blob: Blob
): Promise<UploadPdfResult> {
  const cleanOrderNum = numeroPedido ? String(numeroPedido) : pedidoId.slice(0, 8);
  const fileName = `orcamento-${cleanOrderNum}.pdf`;

  try {
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('orcamentos')
      .upload(fileName, blob, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      console.warn('Supabase storage upload error:', uploadError);
      return {
        publicUrl: '',
        isSupabaseHosted: false,
        error: uploadError.message,
      };
    }

    const { data: urlData } = supabase.storage.from('orcamentos').getPublicUrl(fileName);

    return {
      publicUrl: urlData.publicUrl,
      isSupabaseHosted: true,
    };
  } catch (err: any) {
    console.warn('Erro ao conectar ao Supabase Storage:', err);
    return {
      publicUrl: '',
      isSupabaseHosted: false,
      error: err.message,
    };
  }
}

/**
 * Gera o link direto para o WhatsApp com mensagem formatada e personalizada.
 */
export function buildWhatsAppLink({
  cliente,
  pedido,
  pdfUrl,
  itensCount,
  valorTotal,
}: {
  cliente: Cliente;
  pedido: Pedido;
  pdfUrl?: string;
  itensCount: number;
  valorTotal: number;
}): string {
  const cleanPhone = cliente.telefone.replace(/\D/g, '');
  const phoneWithCountry = cleanPhone.startsWith('55')
    ? cleanPhone
    : cleanPhone.length >= 10
    ? `55${cleanPhone}`
    : cleanPhone;

  const orderCode = formatOrderCode(pedido);
  const formattedTotal = formatCurrency(valorTotal);

  let message = `Olá, *${cliente.nome}*! Tudo bem? 🏠✨\n\n`;
  message += `Aqui é da equipe *SmartLar Automação & Segurança Residencial*.\n`;
  message += `Conforme alinhamos, preparamos a sua proposta personalizada:\n\n`;
  message += `📋 *Proposta:* ${orderCode}\n`;
  message += `📦 *Equipamentos:* ${itensCount} produto(s) de automação\n`;
  message += `💰 *Valor Total:* ${formattedTotal}\n`;
  message += `💳 *Condições:* PIX à vista ou Cartão em até 12x\n\n`;

  if (pdfUrl && pdfUrl.startsWith('http')) {
    message += `📄 *Acesse sua proposta completa em PDF:*\n${pdfUrl}\n\n`;
  }

  message += `Qualquer dúvida ou ajuste nos equipamentos, estamos à sua inteira disposição!\n`;
  message += `Podemos confirmar a aprovação para agendarmos a sua instalação?`;

  return `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`;
}
