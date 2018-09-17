#!/bin/bash

# Do a sequelize sync and dump the resulting schema:

export DATABASE_NAME=os_moderator_schema_test_sync
mysql -u root -p$DATABASE_PASSWORD << EOF
DROP DATABASE IF EXISTS $DATABASE_NAME;
CREATE DATABASE $DATABASE_NAME;
GRANT ALL on $DATABASE_NAME.* to $DATABASE_USER;
EOF

node bin/run_sequelize_sync.js

# Now do the same thing, but this time loading base database and running through
# the migrations
export DATABASE_NAME=os_moderator_schema_test_migrations
mysql -u root -p$DATABASE_PASSWORD << EOF
DROP DATABASE IF EXISTS $DATABASE_NAME;
CREATE DATABASE $DATABASE_NAME;
GRANT ALL on $DATABASE_NAME.* to $DATABASE_USER;
EOF
mysql -u root -p$DATABASE_PASSWORD $DATABASE_NAME < seed/initial-database.sql
npx sequelize db:migrate --config ../config/sequelize.js --migrations-path dist/migrations --models-path dist/models


mysql-schema-diff -u root -p=$DATABASE_PASSWORD os_moderator_schema_test_migrations os_moderator_schema_test_sync
