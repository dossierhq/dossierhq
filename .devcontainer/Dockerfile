FROM mcr.microsoft.com/devcontainers/base:bookworm@sha256:3aacff4130e6cf04709f9cab1d7a6d3e1cc4bff6202bc61611831a18d3755673

RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends gnuplot pip postgresql-client
