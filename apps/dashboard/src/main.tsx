import React from 'react'
import ReactDOM from 'react-dom/client'
import { ToastProvider } from '@venator-ui/ui'
import App from './App'
import './globals.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </React.StrictMode>,
)
