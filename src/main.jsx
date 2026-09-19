import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import FnApp from './App.jsx'
import { FnAuthProvider } from './contexto/AuthContext.jsx'
import { FnConfiguracaoSiteProvider } from './contexto/ConfiguracaoSiteContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* FnAuthProvider precisa estar DENTRO do BrowserRouter (usa useNavigate) e
        ACIMA das <Routes> em App.jsx (qualquer página pode chamar useAuth()).
        FnConfiguracaoSiteProvider fica ACIMA do FnAuthProvider: a marca da
        barbearia (nome/logo/cor) precisa aparecer até na tela de FnLogin,
        antes de qualquer sessão existir. */}
    <BrowserRouter>
      <FnConfiguracaoSiteProvider>
        <FnAuthProvider>
          <FnApp />
        </FnAuthProvider>
      </FnConfiguracaoSiteProvider>
    </BrowserRouter>
  </StrictMode>,
)
