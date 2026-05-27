import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ToastProvider } from '@venator-ui/ui';
import { EnclaveNav } from '@enclave/ui-shell';
import App from './App';
import './styles/tokens.css';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <div className="flex h-screen">
          <div className="w-60 shrink-0 border-r border-[var(--border-subtle)]">
            <EnclaveNav />
          </div>
          <div className="flex-1 min-w-0 overflow-auto">
            <App />
          </div>
        </div>
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
