#!/bin/bash
set -e

echo_error() {
  echo -e "\e[31m$1\e[0m"
}

section_start () {
  local section_title="${1}"
  local section_description="${2:-$section_title}"

  echo -e "section_start:`date +%s`:${section_title}[collapsed=true]\r\e[0K${section_description}"
}

section_end () {
  local section_title="${1}"

  echo -e "section_end:`date +%s`:${section_title}\r\e[0K"
}

verify_variables() {
  if [ -z "$CI_REGISTRY_IMAGE" ]; then
    echo_error "CI_REGISTRY_IMAGE is not set"
    exit 1
  fi

  if [ -z "$BUILD_COMMIT_TAG" ]; then
    echo_error "BUILD_COMMIT_TAG is not set"
    exit 1
  fi

  if [ -z "$CACHE_BRANCH_TAG" ]; then
    echo_error "CACHE_BRANCH_TAG is not set"
    exit 1
  fi

  if [ -z "$CACHE_DEFAULT_TAG" ]; then
    echo_error "CACHE_DEFAULT_TAG is not set"
    exit 1
  fi
}

build_docker_image() {
  local target=$1
  local image_name=$2
  local cache_to=${3:-}

  section_start "build_${target}" "Building ${image_name} (target: ${target})"

  local cache_to_arg=""
  if [ -n "$cache_to" ]; then
    cache_to_arg="--cache-to type=registry,ref=$CI_REGISTRY_IMAGE/build-cache:$CACHE_BRANCH_TAG,mode=max"
  fi

  (set -x; docker --config ./.docker buildx build \
    --builder builder \
    --cache-from type=registry,ref=$CI_REGISTRY_IMAGE/build-cache:$CACHE_BRANCH_TAG \
    --cache-from type=registry,ref=$CI_REGISTRY_IMAGE/build-cache:$CACHE_DEFAULT_TAG \
    $cache_to_arg \
    --platform=linux/amd64 \
    --build-arg SOURCE_VERSION=$CI_COMMIT_SHORT_SHA \
    --file ./Dockerfile \
    --target $target \
    --tag $CI_REGISTRY_IMAGE/$image_name:$BUILD_COMMIT_TAG \
    --progress=plain \
    --provenance=false \
    --push \
    .)

  section_end "build_${target}"
}

retag_if_release() {
  local image_name=$1

  if [ -n "$CI_COMMIT_TAG" ]; then
    section_start "retag_${image_name}" "Retagging ${image_name} with release tag"

    (set -x; docker --config ./.docker buildx imagetools create \
      --tag $CI_REGISTRY_IMAGE/$image_name:$CI_COMMIT_TAG \
      $CI_REGISTRY_IMAGE/$image_name:$BUILD_COMMIT_TAG)

    section_end "retag_${image_name}"
  fi
}

main() {
  verify_variables

  build_docker_image "runner" "chat-with-data" "push-cache"
  retag_if_release "chat-with-data"
}

main
