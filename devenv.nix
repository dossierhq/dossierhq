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
  scripts.rush.exec = "node \"$DEVENV_ROOT/common/scripts/install-run-rush.js\" \"$@\"";
  scripts.rushx.exec = "node \"$DEVENV_ROOT/common/scripts/install-run-rushx.js\" \"$@\"";

  # https://devenv.sh/pre-commit-hooks/
  # pre-commit.hooks.prettier.enable = true;

  # https://devenv.sh/processes/
  # processes.ping.exec = "ping example.com";

  # https://devenv.sh/processes/
  services.postgres.enable = true;
  services.postgres.listen_addresses = "127.0.0.1";
  services.postgres.port = 5432;
  # https://github.com/NixOS/nixpkgs/blob/master/pkgs/servers/sql/postgresql/packages.nix
  services.postgres.package = pkgs.postgresql_15.withPackages (p: [ p.postgis ]);
}
