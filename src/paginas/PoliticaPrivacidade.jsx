import { Link } from 'react-router-dom'

// Página da raiz "/politica-de-privacidade" — igual a Landing.jsx, não
// pertence a nenhuma barbearia específica: é UMA política só, que serve
// pra plataforma inteira (todas as barbearias que rodam neste sistema),
// porque todas seguem o mesmo jeito de guardar/proteger dado (mesmo
// código, mesma infraestrutura). Existe principalmente pra ser o link
// exigido pela Play Store na hora de publicar o app Android de cada
// barbearia (ver README.md do front, seção "App Android").
export function FnPoliticaPrivacidade() {
  return (
    <div className="min-h-screen bg-white text-slate-700 dark:bg-slate-950 dark:text-slate-300">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <Link
          to="/"
          className="text-sm text-slate-500 hover:text-slate-700 hover:underline dark:text-slate-400 dark:hover:text-slate-200"
        >
          ← Voltar
        </Link>

        <h1 className="mt-6 text-2xl font-bold text-slate-900 dark:text-white">Política de Privacidade</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Última atualização: setembro de 2026</p>

        <div className="mt-8 flex flex-col gap-6 text-sm leading-relaxed">
          <p>
            Esta política explica como o sistema de agendamento para barbearias (site e aplicativo) coleta,
            usa e protege os dados de quem usa qualquer barbearia atendida por ele. Vale igualmente para o
            site e para o aplicativo de cada barbearia.
          </p>

          <section>
            <h2 className="font-semibold text-slate-900 dark:text-white">Quais dados coletamos</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Dados de cadastro: nome completo, e-mail, telefone e senha (a senha nunca é guardada em texto — só um hash irreversível dela).</li>
              <li>Dados de cliente: CPF e data de nascimento (opcionais, quando informados pela barbearia).</li>
              <li>Foto de perfil e, no caso da barbearia, logo e fotos do espaço (quando enviadas).</li>
              <li>Histórico de agendamentos, serviços escolhidos, planos de assinatura e status de pagamento.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-slate-900 dark:text-white">Para que usamos esses dados</h2>
            <p className="mt-2">
              Só para operar o sistema de agendamento: identificar sua conta, marcar/gerenciar horários,
              controlar planos de assinatura e mostrar seu histórico. Não usamos seus dados para publicidade,
              e não vendemos nem compartilhamos dados com terceiros para fins de marketing.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-slate-900 dark:text-white">Onde os dados ficam guardados</h2>
            <p className="mt-2">
              Em provedores de nuvem que prestam serviço de hospedagem e banco de dados pra este sistema —
              usados só pra fazer o sistema funcionar, nunca com acesso de terceiros aos seus dados. Toda
              comunicação entre seu dispositivo e o sistema é criptografada (HTTPS).
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-slate-900 dark:text-white">Seus direitos</h2>
            <p className="mt-2">
              Você pode pedir pra ver, corrigir ou apagar seus dados a qualquer momento, falando direto com a
              barbearia onde tem cadastro (ela é quem administra os dados dos próprios clientes) ou pelo
              contato abaixo, pra questões sobre a plataforma em si.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-slate-900 dark:text-white">Contato</h2>
            <p className="mt-2">
              Dúvidas sobre esta política:{' '}
              <a href="mailto:gabrielmoreira9699@gmail.com" className="underline">
                gabrielmoreira9699@gmail.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
