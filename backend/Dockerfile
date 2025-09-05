FROM node:20-alpine

WORKDIR /app

# Ensure Prisma schema exists before npm install triggers postinstall (prisma generate)
COPY prisma ./prisma
COPY package.json package-lock.json* .npmrc* ./
RUN npm ci --omit=dev || npm install --omit=dev

COPY src ./src
COPY .env ./.env

RUN npx prisma generate

EXPOSE 4000

CMD ["node", "src/index.js"]

