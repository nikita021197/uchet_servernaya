# Multi-stage build для оптимизации размера образа
# Stage 1: Сборка приложения
FROM node:20-alpine AS builder

WORKDIR /app

# Копируем package files для лучшего кэширования
COPY package*.json ./

# Устанавливаем ВСЕ зависимости (включая dev для сборки)
RUN npm ci

# Копируем исходный код
COPY . .

# Собираем приложение
RUN npm run build

# Stage 2: Production image с backend
FROM node:20-alpine

WORKDIR /app

# Устанавливаем только production зависимости
COPY package*.json ./
RUN npm ci --only=production

# Копируем backend
COPY server/ ./server/

# Копируем собранный frontend
COPY --from=builder /app/dist ./dist

# Создаем директорию для данных
RUN mkdir -p /app/data

# Expose порт
EXPOSE 4321

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4321/health || exit 1

# Запускаем backend сервер
ENV PORT=4321
ENV DB_PATH=/app/data/app.db
CMD ["node", "server/index.js"]
