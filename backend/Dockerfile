FROM node:20-bookworm-slim

WORKDIR /app

# Ensure system certs and openssl are present
RUN apt-get update && apt-get install -y --no-install-recommends \
  ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/*

# Ensure Prisma schema exists before npm install triggers postinstall (prisma generate)
COPY prisma ./prisma
COPY package.json package-lock.json* .npmrc* ./
RUN npm ci --omit=dev || npm install --omit=dev

COPY src ./src
COPY .env ./.env

RUN npx prisma generate

EXPOSE 4000

CMD ["node", "src/index.js"]

