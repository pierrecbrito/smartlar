import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ModalPortalProps {
  children: React.ReactNode;
}

/**
 * Renderiza o modal diretamente no `document.body` para garantir que o backdrop
 * semi-transparente cubra 100% da viewport (incluindo Header e Sidebar),
 * sem ser confinado pelo contêiner <main> ou por stacking contexts locais.
 */
export const ModalPortal: React.FC<ModalPortalProps> = ({ children }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Bloqueia scroll do body enquanto o modal estiver aberto
    document.body.style.overflow = 'hidden';
    return () => {
      setMounted(false);
      document.body.style.overflow = '';
    };
  }, []);

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(children, document.body);
};
