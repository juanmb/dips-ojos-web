.PHONY: help test test-cov lint format clean

help:
	@echo "Usage: make <target>"
	@echo ""
	@echo "Targets:"
	@echo "  test       Run tests"
	@echo "  test-cov   Run tests with coverage report"
	@echo "  lint       Run ruff linter"
	@echo "  format     Format code with ruff"
	@echo "  clean      Remove generated files"

test:
	uv run pytest

test-cov:
	uv run pytest --cov=transit_plotter --cov-report=term-missing

lint:
	uv run ruff check .

format:
	uv run ruff format .

clean:
	rm -rf .pytest_cache
	rm -rf __pycache__ transit_plotter/__pycache__ tests/__pycache__
	rm -rf .coverage htmlcov
