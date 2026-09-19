// Conjunto próprio de ícones em SVG (traço/"outline"), todos desenhados
// aqui à mão — zero emoji e zero biblioteca de ícones externa. Mesma
// linguagem visual em todo o sistema: só o desenho muda, a "moldura"
// (viewBox, espessura de traço, cor herdada do texto) é sempre a mesma.
function FnIcone({ children, className = 'h-5 w-5', ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

export function FnIconLogo(props) {
  return (
    <FnIcone {...props}>
      <rect x="3" y="3" width="18" height="18" rx="6" />
      <path d="M7 15l10-10M7 9l10 10" />
    </FnIcone>
  )
}

export function FnIconCalendario(props) {
  return (
    <FnIcone {...props}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" />
    </FnIcone>
  )
}

export function FnIconUsuario(props) {
  return (
    <FnIcone {...props}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c1.4-3.6 4.4-5.5 7.5-5.5s6.1 1.9 7.5 5.5" />
    </FnIcone>
  )
}

export function FnIconTesoura(props) {
  return (
    <FnIcone {...props}>
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="6" cy="18" r="2.5" />
      <path d="M8 7.5 20 19M8 16.5 20 5" />
    </FnIcone>
  )
}

export function FnIconEquipe(props) {
  return (
    <FnIcone {...props}>
      <circle cx="9" cy="8" r="3" />
      <path d="M2.5 19c1.1-3 3.6-4.8 6.5-4.8s5.4 1.8 6.5 4.8" />
      <circle cx="17" cy="7" r="2.3" />
      <path d="M15.3 14.6c2.2.4 3.9 1.9 4.7 4.4" />
    </FnIcone>
  )
}

export function FnIconClipboard(props) {
  return (
    <FnIcone {...props}>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <rect x="9" y="2.5" width="6" height="3.5" rx="1" />
      <path d="M8.5 11h7M8.5 15h7" />
    </FnIcone>
  )
}

export function FnIconChave(props) {
  return (
    <FnIcone {...props}>
      <circle cx="8" cy="15" r="4" />
      <path d="M11 12l9-9M17 6l2.5 2.5M14 9l2 2" />
    </FnIcone>
  )
}

export function FnIconSair(props) {
  return (
    <FnIcone {...props}>
      <path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" />
      <path d="M15 16l4-4-4-4M19 12H9" />
    </FnIcone>
  )
}

export function FnIconOlho(props) {
  return (
    <FnIcone {...props}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </FnIcone>
  )
}

export function FnIconOlhoFechado(props) {
  return (
    <FnIcone {...props}>
      <path d="M3 3l18 18" />
      <path d="M10.6 5.2A10.6 10.6 0 0 1 12 5c6.5 0 10 7 10 7a15.6 15.6 0 0 1-3.4 4.3M6.8 6.8C4.2 8.5 2 12 2 12s3.5 7 10 7c1.4 0 2.6-.3 3.7-.8" />
      <path d="M9.9 10a3 3 0 0 0 4.2 4.2" />
    </FnIcone>
  )
}

export function FnIconCheck(props) {
  return (
    <FnIcone {...props}>
      <path d="M5 12.5l4.5 4.5L19 7" />
    </FnIcone>
  )
}

export function FnIconX(props) {
  return (
    <FnIcone {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </FnIcone>
  )
}

export function FnIconChevronEsquerda(props) {
  return (
    <FnIcone {...props}>
      <path d="M15 5l-7 7 7 7" />
    </FnIcone>
  )
}

export function FnIconMoeda(props) {
  return (
    <FnIcone {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v9M9.5 9.8c0-1.1 1.1-1.9 2.5-1.9s2.5.8 2.5 1.8c0 2.4-5 1.1-5 3.5 0 1 1.1 1.8 2.5 1.8s2.5-.8 2.5-1.9" />
    </FnIcone>
  )
}

export function FnIconSino(props) {
  return (
    <FnIcone {...props}>
      <path d="M6 16V10a6 6 0 1 1 12 0v6l1.5 2.5h-15L6 16Z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </FnIcone>
  )
}

export function FnIconChevronDireita(props) {
  return (
    <FnIcone {...props}>
      <path d="M9 5l7 7-7 7" />
    </FnIcone>
  )
}

// Botão "hamburguer" — abre o menu lateral no celular/tablet (ver
// Layout.jsx), onde a barra lateral fixa do desktop não cabe na tela.
export function FnIconMenu(props) {
  return (
    <FnIcone {...props}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </FnIcone>
  )
}

// Crachá/identificação — item de menu "Meu perfil" (ver Layout.jsx) e o
// cartão de usuário no rodapé da barra lateral.
export function FnIconIdentificacao(props) {
  return (
    <FnIcone {...props}>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <circle cx="12" cy="10" r="2.5" />
      <path d="M8 17c0.8-2 2-3 4-3s3.2 1 4 3M9 7h.01M15 7h.01" />
    </FnIcone>
  )
}

// Sol/lua — alterna entre modo claro e escuro (ver Layout.jsx e
// ganchos/useTema.js). Um só componente: o próprio `escuro` decide qual
// desenho mostrar, então quem usa não precisa escolher o ícone certo.
export function FnIconTema({ escuro, ...props }) {
  if (escuro) {
    return (
      <FnIcone {...props}>
        <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" />
      </FnIcone>
    )
  }

  return (
    <FnIcone {...props}>
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
    </FnIcone>
  )
}

// Carteirinha de assinatura — item de menu "Meu plano" (ver Layout.jsx)
// e o cabeçalho da própria página (paginas/MeuPlano.jsx).
export function FnIconCarteirinha(props) {
  return (
    <FnIcone {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <circle cx="8.5" cy="12" r="2.3" />
      <path d="M13.5 10h4M13.5 14h4" />
    </FnIcone>
  )
}

// Setas circulares — ação "Renovar" (paginas/MeuPlano.jsx): pedir mais um
// ciclo do mesmo plano depois que a assinatura atual acaba/vence.
export function FnIconRenovar(props) {
  return (
    <FnIcone {...props}>
      <path d="M4 12a8 8 0 0 1 13.7-5.7L20 8.5" />
      <path d="M20 4v4.5h-4.5" />
      <path d="M20 12a8 8 0 0 1-13.7 5.7L4 15.5" />
      <path d="M4 20v-4.5h4.5" />
    </FnIcone>
  )
}

// Pincel — item de menu "Aparência" (ver Layout.jsx e
// paginas/ConfiguracaoAparencia.jsx), a personalização de logo/cor que só
// o Admin vê.
export function FnIconPincel(props) {
  return (
    <FnIcone {...props}>
      <path d="M15.5 3.5a2.1 2.1 0 0 1 3 3L10 15l-4 1 1-4 8.5-8.5Z" />
      <path d="M4.5 21c1-3.5 2.7-5.5 5-6" />
    </FnIcone>
  )
}

// Troféu — item de menu "Ranking" (ver Layout.jsx e paginas/Ranking.jsx) e
// o destaque do 1º lugar do pódio.
export function FnIconTrofeu(props) {
  return (
    <FnIcone {...props}>
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
      <path d="M7 5H4a3 3 0 0 0 3 5M17 5h3a3 3 0 0 1-3 5" />
      <path d="M12 14v3M9 21h6M9.5 21c0-2 .8-3 2.5-3s2.5 1 2.5 3" />
    </FnIcone>
  )
}

// Presente — usado na seção de prêmios do FnRanking (o que cada posição do
// pódio ganha).
export function FnIconPresente(props) {
  return (
    <FnIcone {...props}>
      <rect x="3.5" y="9" width="17" height="11" rx="1.5" />
      <path d="M3.5 13h17M12 9v11" />
      <path d="M12 9C9.5 9 8 7.8 8 6.2A2.2 2.2 0 0 1 10.2 4c1.9 0 2.8 2.4 1.8 5ZM12 9c2.5 0 4-1.2 4-2.8A2.2 2.2 0 0 0 13.8 4c-1.9 0-2.8 2.4-1.8 5Z" />
    </FnIcone>
  )
}

// Pessoa + lista — usado na aba "Fila de espera" (uma pessoa e, ao lado,
// a "lista" de quem está na frente dela na vez de cortar o cabelo).
export function FnIconFila(props) {
  return (
    <FnIcone {...props}>
      <circle cx="6" cy="7" r="2.3" />
      <path d="M2.5 18.5c.7-2.8 2-4.3 3.5-4.3s2.8 1.5 3.5 4.3" />
      <path d="M12 8h9M12 12.5h6M12 17h9" />
    </FnIcone>
  )
}

// Fachada/loja (toldo + porta) — item de menu "Sobre a barbearia" (ver
// Layout.jsx e paginas/SobreABarbearia.jsx): localização, informações do
// negócio, galeria de fotos e perfil profissional do barbeiro.
export function FnIconLoja(props) {
  return (
    <FnIcone {...props}>
      <path d="M4 9.5 5 4h14l1 5.5" />
      <path d="M3.5 9.5a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0" />
      <path d="M5 10v10h14V10" />
      <path d="M10 20v-5.5a2 2 0 0 1 4 0V20" />
    </FnIcone>
  )
}

// Pino de mapa — usado na seção "Localização" da aba "Sobre a barbearia"
// (ver paginas/SobreABarbearia.jsx).
export function FnIconLocalizacao(props) {
  return (
    <FnIcone {...props}>
      <path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z" />
      <circle cx="12" cy="9" r="2.5" />
    </FnIcone>
  )
}

// Foto/imagem (moldura + montanha + sol) — usado na seção "Fotos" da aba
// "Sobre a barbearia" (galeria do espaço, ver paginas/SobreABarbearia.jsx).
export function FnIconFoto(props) {
  return (
    <FnIcone {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.6" />
      <path d="M3 16.5 8.5 12l3.5 3 3-2.5L21 16" />
    </FnIcone>
  )
}

// Triângulo de alerta — usado no FnToast de erro (ver componentes/ui/Toast.jsx),
// substituindo o alert() nativo do navegador em toda ação rápida de
// lista (Fnativar/Fninativar, Fncancelar, etc.).
export function FnIconAlerta(props) {
  return (
    <FnIcone {...props}>
      <path d="M12 3.5 21.5 20h-19L12 3.5Z" />
      <path d="M12 9.5v4M12 17h.01" />
    </FnIcone>
  )
}

// Lupa — usada no FnCampoBusca (ver componentes/ui/Field.jsx), o campo de
// busca das abas com lista grande de pessoas (Clientes, Usuários,
// Pagamentos).
export function FnIconBusca(props) {
  return (
    <FnIcone {...props}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M20 20 15.65 15.65" />
    </FnIcone>
  )
}
