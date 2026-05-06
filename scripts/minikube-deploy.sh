#!/usr/bin/env bash
set -euo pipefail

echo "==> Starting Minikube..."
minikube start --cpus 4 --memory 8192 --driver docker

echo "==> Pointing Docker to Minikube daemon..."
eval "$(minikube docker-env)"

echo "==> Building images inside Minikube..."
docker build -t slb-worker:latest ./workers
docker build -t slb-classifier:latest ./classifier
docker build -t slb-proxy:latest ./proxy
docker build -t slb-dashboard:latest ./dashboard

echo "==> Applying Kubernetes manifests..."
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/ollama/
kubectl apply -f k8s/workers/
kubectl apply -f k8s/classifier/
kubectl apply -f k8s/proxy/
kubectl apply -f k8s/dashboard/

echo "==> Waiting for proxy rollout..."
kubectl rollout status deployment/proxy -n semantic-lb --timeout=120s

echo ""
echo "==> Proxy URL:"
minikube service proxy-svc -n semantic-lb --url

echo "==> Dashboard URL:"
minikube service dashboard-svc -n semantic-lb --url
