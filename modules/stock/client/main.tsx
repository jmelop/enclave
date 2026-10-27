import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ToastProvider } from '@venator-ui/ui'
import '@/styles/globals.css'
import App from './App'

// Apply saved theme before first render to avoid flash
const saved = localStorage.getItem('enclave-theme') ?? 'dark'
document.documentElement.setAttribute('data-theme', saved)

// The dashboard provides its own ToastProvider; standalone dev needs one here.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ToastProvider>
  </StrictMode>,
)
