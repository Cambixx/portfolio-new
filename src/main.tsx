import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './styles/global.scss'
import './styles/sections.scss'
import { preloadCriticalResources } from './utils/performanceOptimizer'

// Preload de recursos críticos
preloadCriticalResources();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
