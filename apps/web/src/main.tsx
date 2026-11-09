import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { cssVariablesText } from '@pidohora/tokens';
import App from './App';
import './styles.css';

// Colores, sombras y radios desde la misma fuente que la app (@pidohora/tokens).
const tokens = document.createElement('style');
tokens.textContent = `:root { ${cssVariablesText()} }`;
document.head.prepend(tokens);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
