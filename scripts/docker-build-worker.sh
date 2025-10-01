#!/bin/bash

# DirectoryBolt Worker Docker Build Script
# Builds and optionally pushes the worker container

set -e

echo "🐳 DirectoryBolt Worker - Docker Build"
echo "======================================="
echo ""

# Configuration
IMAGE_NAME="directorybolt-worker"
VERSION="${VERSION:-latest}"
REGISTRY="${DOCKER_REGISTRY:-docker.io}"
NAMESPACE="${DOCKER_NAMESPACE:-your-username}"

# Full image tag
FULL_TAG="$REGISTRY/$NAMESPACE/$IMAGE_NAME:$VERSION"

echo "📦 Building image: $FULL_TAG"
echo ""

# Build from worker directory
cd "$(dirname "$0")/.."

# Build the worker image
echo "🔨 Building Docker image..."
docker build \
  -f worker/Dockerfile.worker \
  -t "$IMAGE_NAME:$VERSION" \
  -t "$IMAGE_NAME:latest" \
  .

echo "✅ Build successful!"
echo ""

# Ask if user wants to tag and push
if [ "$CI" != "true" ]; then
  read -p "🚀 Do you want to tag and push to registry? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Skipping push. Image built locally as: $IMAGE_NAME:$VERSION"
    exit 0
  fi
fi

# Check if registry credentials are available
if [ -z "$DOCKER_REGISTRY" ] || [ -z "$DOCKER_NAMESPACE" ]; then
  echo "⚠️  Docker registry or namespace not configured"
  echo "   Set DOCKER_REGISTRY and DOCKER_NAMESPACE environment variables"
  echo ""
  echo "Example:"
  echo "  export DOCKER_REGISTRY=ghcr.io"
  echo "  export DOCKER_NAMESPACE=your-github-username"
  echo ""
  exit 1
fi

# Tag for registry
echo "🏷️  Tagging image: $FULL_TAG"
docker tag "$IMAGE_NAME:$VERSION" "$FULL_TAG"

# Push to registry
echo "📤 Pushing to registry..."
if docker push "$FULL_TAG"; then
  echo "✅ Successfully pushed: $FULL_TAG"
  echo ""
  echo "🎉 Worker container is ready for deployment!"
  echo ""
  echo "Deploy with:"
  echo "  Railway: railway up --image $FULL_TAG"
  echo "  Fly.io: fly deploy --image $FULL_TAG"
  echo "  Render: Use $FULL_TAG in dashboard"
else
  echo "❌ Push failed. Check your registry credentials."
  echo ""
  echo "Login to registry:"
  echo "  docker login $REGISTRY"
  exit 1
fi

