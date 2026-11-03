.PHONY: help dev build start stop restart logs clean test lint docker-build docker-up docker-down docker-logs docker-rebuild

# Цвета для вывода
GREEN  := $(shell tput -Txterm setaf 2)
YELLOW := $(shell tput -Txterm setaf 3)
RESET  := $(shell tput -Txterm sgr0)

help: ## Показать справку
	@echo ''
	@echo 'Использование: make ${YELLOW}<target>${RESET}'
	@echo ''
	@echo 'Цели:'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  ${GREEN}%-20s${RESET} %s\n", $$1, $$2}'

# Локальная разработка
dev: ## Запустить dev-сервер с горячей перезагрузкой
	npm run dev

build: ## Собрать приложение для production
	npm run build

start: ## Запустить production-сервер локально
	npm run preview

# Docker команды
docker-build: ## Собрать Docker-образ
	docker compose build

docker-up: ## Запустить контейнеры в фоне
	docker compose up -d

docker-down: ## Остановить и удалить контейнеры
	docker compose down

docker-restart: ## Перезапустить контейнеры
	docker compose restart

docker-logs: ## Показать логи контейнеров
	docker compose logs -f

docker-rebuild: ## Пересобрать и перезапустить контейнеры
	docker compose down
	docker compose build --no-cache
	docker compose up -d

docker-status: ## Показать статус контейнеров
	docker compose ps

# Утилиты
clean: ## Очистить node_modules и dist
	rm -rf node_modules dist
	@echo "Очищено"

test: ## Запустить тесты
	npm run test

lint: ## Запустить линтер
	npm run lint

# Полная установка
install: ## Установить зависимости
	npm install

# Быстрый старт
quick-start: ## Быстрый старт: установить зависимости и запустить dev-сервер
	@echo "Установка зависимостей..."
	npm install
	@echo "Запуск dev-сервера..."
	npm run dev

# Docker быстрый старт
docker-quick-start: ## Быстрый старт через Docker
	@echo "Сборка Docker-образа..."
	docker compose build
	@echo "Запуск контейнеров..."
	docker compose up -d
	@echo "Приложение доступно на http://localhost:4321"
