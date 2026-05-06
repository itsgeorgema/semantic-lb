FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod .
COPY main.go .
RUN go build -o worker .

FROM alpine:3.19
WORKDIR /app
COPY --from=builder /app/worker .
ARG WORKER_TYPE=general
ARG WORKER_PORT=9001
ENV WORKER_TYPE=${WORKER_TYPE}
ENV WORKER_PORT=${WORKER_PORT}
CMD ["sh", "-c", "./worker --type ${WORKER_TYPE} --port ${WORKER_PORT}"]
