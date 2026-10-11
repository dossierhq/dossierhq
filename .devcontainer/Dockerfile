FROM mcr.microsoft.com/devcontainers/base:bookworm@sha256:c817051aa895a88c4bf28a14f47140db1fe88037c45604c3fe025d66d246200f

RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends gnuplot pip postgresql-client
