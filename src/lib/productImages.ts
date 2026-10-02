// Mapeamento de imagens reais e de alta definição para os equipamentos da SmartLar

export const PRODUCT_REAL_IMAGES: Record<string, string> = {
  camera_externa: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=600&q=80',
  camera_interna: 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=600&q=80',
  sensor_abertura: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=600&q=80',
  fechadura_biometrica: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=600&q=80',
  central_zigbee: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80',
  lampada_rgb: 'https://images.unsplash.com/photo-1550524514-9b59e5111956?auto=format&fit=crop&w=600&q=80',
  smart_speaker: 'https://images.unsplash.com/photo-1543512214-318c7553f230?auto=format&fit=crop&w=600&q=80',
  interruptor_touch: 'https://images.unsplash.com/photo-1563770660941-20978e870e26?auto=format&fit=crop&w=600&q=80',
};

export const getProductImage = (nome: string, categoria: string = ''): string => {
  const n = (nome || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const c = (categoria || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  if (n.includes('camera') && (n.includes('interna') || n.includes('360'))) {
    return PRODUCT_REAL_IMAGES.camera_interna;
  }
  if (n.includes('camera')) {
    return PRODUCT_REAL_IMAGES.camera_externa;
  }
  if (n.includes('fechadura')) {
    return PRODUCT_REAL_IMAGES.fechadura_biometrica;
  }
  if (n.includes('sensor')) {
    return PRODUCT_REAL_IMAGES.sensor_abertura;
  }
  if (n.includes('speaker') || n.includes('assistente') || n.includes('som')) {
    return PRODUCT_REAL_IMAGES.smart_speaker;
  }
  if (n.includes('lampada') || n.includes('iluminacao') || n.includes('led') || n.includes('rgb')) {
    return PRODUCT_REAL_IMAGES.lampada_rgb;
  }
  if (n.includes('interruptor') || n.includes('dimmer') || n.includes('tomada')) {
    return PRODUCT_REAL_IMAGES.interruptor_touch;
  }
  if (n.includes('central') || n.includes('hub') || n.includes('zigbee') || n.includes('gateway')) {
    return PRODUCT_REAL_IMAGES.central_zigbee;
  }

  // Fallback por categoria
  if (c.includes('seguranca')) return PRODUCT_REAL_IMAGES.camera_externa;
  if (c.includes('iluminacao')) return PRODUCT_REAL_IMAGES.lampada_rgb;
  if (c.includes('automacao')) return PRODUCT_REAL_IMAGES.central_zigbee;

  return PRODUCT_REAL_IMAGES.camera_externa;
};
