# Build de produção do front — vira um bundle estático (HTML/JS/CSS),
# servido por um nginx pequeno (imagem final não carrega Node nenhum).

# --- estágio 1: build (Node, só pra gerar o bundle) -------------------
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# VITE_API_URL fica "/api" (caminho relativo, não um host:porta fixo) —
# é o que faz o MESMO build funcionar em qualquer host/porta que você
# expuser o container do front, sem precisar rebuildar a imagem: o
# navegador chama a própria origem do front em "/api/...", e é o nginx
# (ver nginx.conf) quem repassa isso pra dentro da rede do Docker
# Compose até o container da Api. Vite lê ARG/ENV do processo com
# prioridade sobre um .env do repositório (ver .dockerignore, que nem
# deixa um .env local entrar no contexto do build, pra não ter dúvida).
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# --- estágio 2: runtime (nginx, serve os arquivos estáticos) ---------
FROM nginx:1.27-alpine AS runtime

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
