#!/bin/bash

# Update environment variables
export HOST_ROOT_DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres
if [ -f ~/.zshenv ] && ! grep -q "HOST_ROOT_DATABASE_URL" ~/.zshenv; then
    echo "export HOST_ROOT_DATABASE_URL=$HOST_ROOT_DATABASE_URL" >> ~/.zshenv
fi
if [ -f ~/.bashrc ] && ! grep -q "HOST_ROOT_DATABASE_URL" ~/.bashrc; then
    echo "export HOST_ROOT_DATABASE_URL=$HOST_ROOT_DATABASE_URL" >> ~/.bashrc
fi

# tools
asdf plugin add nodejs
asdf plugin add bun
asdf plugin add deno
asdf install

pip install -q litecli pgcli

# nvm/node

npm install -g @microsoft/rush

# git user is not yet set, so need to bypass policy
rush update --bypass-policy

(
    cd tools/generic-tools/ || (echo "No such path: tools/generic-tools/"; exit)
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
