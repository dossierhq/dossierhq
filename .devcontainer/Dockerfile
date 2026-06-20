FROM mcr.microsoft.com/devcontainers/base:bookworm@sha256:aba0f2e0730af481edf2db5582a80c0ed2591bee78ec177f7fa7a38e8f5e1105

RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends gnuplot pip postgresql-client
