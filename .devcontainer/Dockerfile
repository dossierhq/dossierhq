FROM mcr.microsoft.com/devcontainers/base:bookworm@sha256:17e6cc517b483d1108b333d4c34352b0a21617f0117052e9b259d47113a9dc37

RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends gnuplot pip postgresql-client
