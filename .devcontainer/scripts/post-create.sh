#!/bin/bash

pip install -q litecli pgcli

curl https://bun.sh/install | bash
echo 'export BUN_INSTALL="$HOME/.bun"' >> ~/.zshenv
echo 'export PATH="$BUN_INSTALL/bin:$PATH"' >> ~/.zshenv

source /usr/local/share/nvm/nvm.sh
nvm install
nvm use
npm install -g @microsoft/rush

export HOST_ROOT_DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres
echo "export HOST_ROOT_DATABASE_URL=$HOST_ROOT_DATABASE_URL" >> ~/.zshenv
(
    cd tools/generic-tools/
    npm run db:ensure-dbs
    npm run db:make-users:superuser
    npm run db:migrate:all
    npm run db:make-users:no-superuser
    echo "Finished setting up database"
)
