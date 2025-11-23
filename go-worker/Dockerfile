FROM golang:1.23 AS builder

WORKDIR /app

# Copia os arquivos do módulo primeiro
COPY go.mod go.sum ./
RUN go mod download

# Copia o restante do código
COPY . .

# Compila o worker
RUN go build -o worker main.go


# --- Stage Final ---
FROM debian:12-slim

WORKDIR /app
COPY --from=builder /app/worker .

CMD ["./worker"]
