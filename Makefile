.PHONY: install backend frontend backend-tests frontend-tests test

# Install dependencies for both sides.
install:
	cd backend && uv sync
	cd frontend && npm install

# Run the backend API only (http://localhost:8000, docs at /api/docs).
backend:
	cd backend && uv run uvicorn app.main:app --reload --port 8000

# Run the frontend dev server only (http://localhost:8080).
frontend:
	cd frontend && npm run dev

# Backend test suite.
backend-tests:
	cd backend && uv run pytest

# Frontend test suite.
frontend-tests:
	cd frontend && npm test

# Run both test suites.
test: backend-tests frontend-tests
