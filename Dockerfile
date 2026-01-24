# Build frontend
FROM node:22-alpine AS frontend-builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY frontend/package.json frontend/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY frontend/ ./
RUN pnpm run build

# Build backend
FROM golang:1.23-alpine AS backend-builder
WORKDIR /app
RUN apk add --no-cache gcc musl-dev
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/ ./
RUN CGO_ENABLED=1 go build -o emoons-web .

# Final image
FROM alpine:3.21
WORKDIR /app

RUN apk add --no-cache ca-certificates

# Copy backend binary and migrations
COPY --from=backend-builder /app/emoons-web ./
COPY --from=backend-builder /app/db/migrations ./db/migrations

# Copy frontend build
COPY --from=frontend-builder /app/dist ./frontend/dist

# Create data directories
RUN mkdir -p /plots /db

# Environment variables
ENV DATABASE_PATH=/db/transit_analysis.db
ENV TRANSITS_CSV_PATH=/plots/transits.csv
ENV CURVES_CSV_PATH=/plots/curves.csv
ENV PLOTS_DIR=/plots
ENV FRONTEND_DIR=/app/frontend/dist
ENV PORT=8080
ENV GIN_MODE=release

EXPOSE 8080

CMD ["./emoons-web"]
