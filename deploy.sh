#!/bin/bash

# Скрипт быстрого развертывания на сервере
# Использование: ./deploy.sh

set -e

echo "🚀 Развертывание приложения для учёта оборудования серверной"
echo "============================================================"

# Проверка наличия Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не установлен. Установите Docker и попробуйте снова."
    exit 1
fi

if ! command -v docker compose &> /dev/null && ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose не установлен. Установите Docker Compose и попробуйте снова."
    exit 1
fi

# Создание .env если не существует
if [ ! -f .env ]; then
    echo "📝 Создаю .env из .env.example..."
    cp .env.example .env
fi

# Остановка старых контейнеров
echo "🛑 Останавливаю старые контейнеры..."
docker compose down 2>/dev/null || docker-compose down 2>/dev/null || true

# Сборка образа
echo "🔨 Собираю Docker-образ..."
docker compose build --no-cache

# Запуск контейнеров
echo "▶️  Запускаю контейнеры..."
docker compose up -d

# Ожидание запуска
echo "⏳ Ожидаю запуска приложения..."
sleep 5

# Проверка здоровья
echo "🏥 Проверяю состояние приложения..."
if curl -f http://localhost:4321/health > /dev/null 2>&1; then
    echo "✅ Приложение успешно запущено!"
    echo ""
    echo "📍 Адрес: http://localhost:4321"
    echo ""
    echo "📊 Статус контейнеров:"
    docker compose ps
else
    echo "⚠️  Приложение запускается. Проверьте логи: docker compose logs -f"
fi

echo ""
echo "🎉 Готово!"
echo ""
echo "Полезные команды:"
echo "  docker compose logs -f    # Просмотр логов"
echo "  docker compose restart    # Перезапуск"
echo "  docker compose down       # Остановка"
echo "  docker compose ps         # Статус контейнеров"
