.PHONY: install dev backend frontend backend-tests frontend-tests test test-integration up down

# Run the whole stack (app + Postgres) with Docker Compose.
up:
	docker compose up --build

# Tear the stack down.
down:
	docker compose down

# Install dependencies for both sides.
install:
	cd backend && uv sync
	cd frontend && npm install

# Run the backend and frontend together; Ctrl-C stops both.
dev:
	trap 'kill 0' EXIT; \
	(cd backend && uv run uvicorn app.main:app --reload --port 8000) & \
	(cd frontend && npm run dev) & \
	wait

# Run the backend API only (http://localhost:8000, docs at /api/docs).
backend:
	cd backend && uv run uvicorn app.main:app --reload --port 8000

# Run the frontend dev server only (http://localhost:8080).
frontend:
	cd frontend && npm run dev

# Backend test suite.
backend-tests:
	cd backend && uv run pytest

# Backend integration tests (real on-disk SQLite database).
test-integration:
	cd backend && uv run pytest tests_integration/

# Frontend test suite.
frontend-tests:
	cd frontend && npm test

# Run both test suites.
test: backend-tests frontend-tests
