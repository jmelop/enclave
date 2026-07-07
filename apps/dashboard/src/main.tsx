import React from 'react'
import ReactDOM from 'react-dom/client'
import { ToastProvider } from '@venator-ui/ui'
import App from './App'
import './globals.css'

// Theme source of truth at runtime is the data-theme attribute on <html>;
// seed it from the persisted preference before anything renders.
document.documentElement.setAttribute(
  'data-theme',
  localStorage.getItem('enclave-theme') === 'light' ? 'light' : 'dark',
)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </React.StrictMode>,
)
