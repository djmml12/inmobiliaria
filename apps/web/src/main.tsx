import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';

// Aplica la escala guardada antes del primer render para evitar flash
const savedScale = localStorage.getItem('ui.escala_texto');
const savedModo = localStorage.getItem('ui.escala_modo') ?? 'completo';
if (savedScale) {
  if (savedModo === 'completo') {
    document.documentElement.style.fontSize = `${savedScale}%`;
  } else {
    document.documentElement.setAttribute('data-scale-mode', 'text');
    document.documentElement.style.setProperty('--text-scale', String(parseInt(savedScale, 10) / 100));
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
);
