import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
        // Facilita testar em outra máquina/porta durante o desenvolvimento.
        host: true,
        watch: {
            // ".vs" é o cache interno do Visual Studio (índice de busca), criado
            // quando você abre um .slnx/.sln aqui dentro — o próprio VS mantém
            // esses arquivos travados pra escrita enquanto está aberto. Sem
            // ignorar, o watcher do Vite tenta observar esses arquivos travados
            // e quebra com "EBUSY: resource busy or locked".
            ignored: ['**/.vs/**'],
        },
    },
})