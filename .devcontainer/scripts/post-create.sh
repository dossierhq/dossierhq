#!/bin/bash

# Update environment variables
export HOST_ROOT_DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres
if [ -f ~/.zshenv ] && ! grep -q "HOST_ROOT_DATABASE_URL" ~/.zshenv; then
    echo "export HOST_ROOT_DATABASE_URL=$HOST_ROOT_DATABASE_URL" >> ~/.zshenv
fi
if [ -f ~/.bashrc ] && ! grep -q "HOST_ROOT_DATABASE_URL" ~/.bashrc; then
    echo "export HOST_ROOT_DATABASE_URL=$HOST_ROOT_DATABASE_URL" >> ~/.bashrc
fi

if [ -f ~/.zshrc ] && ! grep -q "mise" ~/.zshrc; then
    echo 'eval "$(mise activate zsh)"' >> ~/.zshrc
fi
if [ -f ~/.bashrc ] && ! grep -q "mise" ~/.bashrc; then
    echo 'eval "$(mise activate bash)"' >> ~/.bashrc
fi

# tools
mise install
eval "$(mise activate bash)"
pip install --break-system-packages -q litecli pgcli

pnpm install

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
