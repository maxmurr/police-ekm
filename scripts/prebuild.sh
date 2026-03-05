#!/bin/bash
set -e

section_start () {
  local section_title="${1}"
  local section_description="${2:-$section_title}"

  echo -e "section_start:`date +%s`:${section_title}[collapsed=true]\r\e[0K\e[32m${section_description}\e[0m"
}

section_end () {
  local section_title="${1}"

  echo -e "section_end:`date +%s`:${section_title}\r\e[0K"
}

prepare_docker() {
  TIMEOUT=60
  COUNTER=0
  until docker version > /dev/null 2>&1; do
    sleep 1
    COUNTER=$((COUNTER + 1))
    if [ $COUNTER -ge $TIMEOUT ]; then
      echo "Docker daemon did not start within ${TIMEOUT} seconds"
      exit 1
    fi
  done

  set -x

  docker info

  set +x
  echo $CI_REGISTRY_PASSWORD | docker --config ./.docker login -u $CI_REGISTRY_USER --password-stdin $CI_REGISTRY
  set -x

  docker --config ./.docker buildx create --name builder --driver docker-container --use --bootstrap
  docker --config ./.docker buildx inspect --bootstrap
  docker --config ./.docker buildx ls

  set +x
}

main() {
  section_start "prepare_docker" "Preparing docker"
  prepare_docker
  section_end "prepare_docker"
}

main
