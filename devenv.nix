{ pkgs, ... }:

{
  # https://devenv.sh/basics/
  # env.GREET = "devenv";

  # https://devenv.sh/packages/
  packages = [
    pkgs.bun
    pkgs.deno
    pkgs.gnuplot
    pkgs.graphviz
    pkgs.nodejs
    pkgs.playwright
  ];

  # enterShell = ''
  # '';

  # https://devenv.sh/languages/
  # languages.nix.enable = true;

  # https://devenv.sh/scripts/
  # scripts.hello.exec = "echo hello from $GREET";
  scripts.rush.exec = "node \"$(git rev-parse --show-toplevel)/common/scripts/install-run-rush.js\" \"$@\"";
  scripts.rushx.exec = "node \"$(git rev-parse --show-toplevel)/common/scripts/install-run-rushx.js\" \"$@\"";

  # https://devenv.sh/pre-commit-hooks/
  # pre-commit.hooks.prettier.enable = true;

  # https://devenv.sh/processes/
  # processes.ping.exec = "ping example.com";
}
