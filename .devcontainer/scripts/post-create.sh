#!/bin/bash

# Update environment variables
if ! grep -q "BUN_INSTALL" ~/.zshenv; then
    echo 'export BUN_INSTALL="$HOME/.bun"' >> ~/.zshenv
    echo 'export PATH="$BUN_INSTALL/bin:$PATH"' >> ~/.zshenv
fi
if ! grep -q "BUN_INSTALL" ~/.bashrc; then
    echo 'export BUN_INSTALL="$HOME/.bun"' >> ~/.bashrc
    echo 'export PATH="$BUN_INSTALL/bin:$PATH"' >> ~/.bashrc
fi
export HOST_ROOT_DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres
if ! grep -q "HOST_ROOT_DATABASE_URL" ~/.zshenv; then
    echo "export HOST_ROOT_DATABASE_URL=$HOST_ROOT_DATABASE_URL" >> ~/.zshenv
fi
if ! grep -q "HOST_ROOT_DATABASE_URL" ~/.bashrc; then
    echo "export HOST_ROOT_DATABASE_URL=$HOST_ROOT_DATABASE_URL" >> ~/.bashrc
fi

# tools
pip install -q litecli pgcli

# bun
if [ ! -f "$HOME/.bun/bin/bun" ]; then
    curl https://bun.sh/install | bash
fi


# nvm/node
source /usr/local/share/nvm/nvm.sh
nvm install
nvm use
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
