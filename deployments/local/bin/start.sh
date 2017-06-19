#!/bin/bash

export DATABASE_NAME='os_moderator'
export DATABASE_USER='os_moderator'
export DATABASE_HOST='127.0.0.1'
export DATABASE_PASSWORD='local'
export DATABASE_NAME='os_moderator'
export TOKEN_SECRET='token'

USAGE="$(basename "$0") -- Script for starting local ugc-moderator application.

-n, --name      Create a user with the given name on startup.
-e, --email     Create a user with the given email on startup.
-h, --help      See script usage information.
"

if [[ ($1 == "-h") || ($1 == "--help") ]]; then
    echo "${USAGE}"
    exit 0
fi

while [[ $# -gt 1 ]]
do
key="$1"

case ${key} in
    -n|--name)
    USER_NAME="${2:-'default'}"
    shift

    ;;

    -e|--email)
    USER_EMAIL="${2:-'default@email.com'}"
    shift

    ;;

    *)

    ;;
esac

shift
done

docker-compose up -d

sleep 15s

pushd ../..
./bin/osmod migrate
./packages/cli/bin/osmod.js users:create --group general --name ${USER_NAME} --email ${USER_EMAIL}
popd
