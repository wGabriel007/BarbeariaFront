import { FnurlArquivo } from '../../api/client'

const TAMANHOS = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-20 w-20 text-2xl',
}

// Foto da pessoa (ver aba "Meu perfil") se ela tiver enviado uma, senão a
// inicial do nome num círculo colorido — mesmo "avatar" reaproveitado em
// toda tela que mostra alguém (barra lateral, FnBarbeiros, Usuários, Meu
// perfil), pra não reimplementar esse fallback em cada uma.
export function FnAvatar({ nome, fotoUrl, tamanho = 'md', className = '' }) {
  const classeTamanho = TAMANHOS[tamanho] ?? TAMANHOS.md

  if (fotoUrl) {
    return (
      <img
        src={FnurlArquivo(fotoUrl)}
        alt={nome ?? 'Foto de perfil'}
        className={`${classeTamanho} shrink-0 rounded-full object-cover ${className}`}
      />
    )
  }

  return (
    <div
      className={`flex ${classeTamanho} shrink-0 items-center justify-center rounded-full bg-brand-700 font-semibold text-white ${className}`}
    >
      {(nome ?? '?').charAt(0).toUpperCase()}
    </div>
  )
}
