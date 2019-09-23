#!/bin/bash

mkdir -p /var/run/mysqld
chown mysql:mysql /var/run/mysqld/

/usr/bin/mysqld_safe --skip-grant-tables --pid-file=/run/mysqld/mysqld.pid &

sleep 5

mysql -u root << EOF
DELETE FROM mysql.user WHERE User='';
DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');
DROP DATABASE IF EXISTS test;
DELETE FROM mysql.db WHERE Db='test' OR Db='test\\_%';
FLUSH PRIVILEGES;
CREATE DATABASE os_moderator;
CREATE USER 'os_moderator' IDENTIFIED BY '$DATABASE_PASSWORD';
GRANT ALL on os_moderator.* to os_moderator;
EOF

mysql os_moderator < seed/initial-database.sql

mysql -u root << EOF
UPDATE mysql.user SET Password=PASSWORD('$DATABASE_PASSWORD') WHERE User='root';
EOF

cd ${basename}/../packages/backend-api
npx sequelize db:migrate
cd -
