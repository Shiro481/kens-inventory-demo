import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { SettingsProvider } from './context/SettingsContext'
import ErrorBoundary from './components/ErrorBoundary'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <SettingsProvider>
        <App />
      </SettingsProvider>
    </ErrorBoundary>
  </StrictMode>,
)
