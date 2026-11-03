# Multi-stage build для оптимизации размера образа
# Stage 1: Сборка приложения
FROM node:20-alpine AS builder

WORKDIR /app

# Копируем package files для лучшего кэширования
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci --only=production

# Копируем исходный код
COPY . .

# Собираем приложение
RUN npm run build

# Stage 2: Production image с nginx
FROM nginx:alpine

# Копируем nginx конфигурацию
COPY nginx.conf /etc/nginx/nginx.conf

# Копируем собранные файлы из builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Создаем директорию для логов
RUN mkdir -p /var/log/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /usr/share/nginx/html

# Expose порт
EXPOSE 4321

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4321/ || exit 1

# Запускаем nginx в foreground режиме
CMD ["nginx", "-g", "daemon off;"]
