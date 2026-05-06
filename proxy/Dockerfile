FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o proxy .

FROM gcr.io/distroless/static:nonroot
COPY --from=builder /app/proxy /proxy
EXPOSE 8080 9090
ENTRYPOINT ["/proxy"]
