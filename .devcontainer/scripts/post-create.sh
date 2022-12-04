#!/bin/bash

pip install -q litecli pgcli

curl https://bun.sh/install | bash
echo 'export BUN_INSTALL="$HOME/.bun"' >> ~/.zshenv
echo 'export PATH="$BUN_INSTALL/bin:$PATH"' >> ~/.zshenv

source /usr/local/share/nvm/nvm.sh
nvm install
nvm use
npm install -g @microsoft/rush

# git user is not yet set, so need to bypass policy
rush update --bypass-policy

export HOST_ROOT_DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres
echo "export HOST_ROOT_DATABASE_URL=$HOST_ROOT_DATABASE_URL" >> ~/.zshenv
(
    cd tools/generic-tools/
    echo "Ensuring all databases exist"
    npm run db:ensure-dbs
    echo "Making users super users so they can install extensions"
    npm run db:make-users:superuser
    echo "Migrating all databases"
    npm run db:migrate:all
    echo "Making user not super users"
    npm run db:make-users:no-superuser
    echo "Finished setting up database"
)
