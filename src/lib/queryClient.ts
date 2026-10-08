import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutos de cache ativo
      gcTime: 1000 * 60 * 10, // 10 minutos na memória
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
