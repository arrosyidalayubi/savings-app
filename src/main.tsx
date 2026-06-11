import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.tsx';
import './index.css';

// Inisialisasi QueryClient
// Ini adalah "otak" yang akan menyimpan semua cache data Anda
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Opsional: Jangan fetch ulang otomatis saat user pindah tab browser
      staleTime: 1000 * 60 * 5,    // Opsional: Anggap data masih "segar" selama 5 menit
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);