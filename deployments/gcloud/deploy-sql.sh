#!/bin/bash
# Create a managed SQL instance and populate it with initial data
# This script assumes the following environment variables have been set

# SQL_INSTANCE_NAME - Label to use for the ConversationAI MySQL instance
# DATABASE_NAME - Name of the database
# DATABASE_USER - Database user
# DATABASE_PASSWORD - Database password

# It also assumes that gcloud is configured to manage the correct Google
# Cloud project and compute region, and that an appropriate service account
# has been created.  See the README for details on how to set these things
# up

set -e
set -u

if [ -z "$SQL_INSTANCE_NAME" ]; then
  echo "SQL_INSTANCE_NAME is not defined"
  exit;
fi

if [ -z "$DATABASE_NAME" ]; then
  echo "DATABASE_NAME is not defined"
  exit;
fi

if [ -z "$DATABASE_USER" ]; then
  echo "DATABASE_USER is not defined"
  exit;
fi

if [ -z "$DATABASE_PASSWORD" ]; then
  echo "DATABASE_PASSWORD is not defined"
  exit;
fi

gcloud sql instances create $SQL_INSTANCE_NAME --tier=db-g1-small --database-version=MYSQL_5_7
gcloud sql users set-password root % --instance $SQL_INSTANCE_NAME --password $DATABASE_PASSWORD
gcloud sql users create $DATABASE_USER % --instance=$SQL_INSTANCE_NAME --password=$DATABASE_PASSWORD
gcloud sql databases create $DATABASE_NAME --instance=$SQL_INSTANCE_NAME

export SQL_CONNECTION=`gcloud sql instances describe $SQL_INSTANCE_NAME --format "value(connectionName)"`

# Set up SQL proxy on local machine so we can tunnel through the firewall and access the database
/cloudsql/cloud_sql_proxy -dir=/cloudsql -instances=$SQL_CONNECTION -credential_file=/cloudsql/key.json &
mysql --socket=/cloudsql/$SQL_CONNECTION --user=root --password=$DATABASE_PASSWORD << EOF
GRANT ALL on $DATABASE_NAME.* to $DATABASE_USER
EOF
mysql --socket=/cloudsql/$SQL_CONNECTION --user=$DATABASE_USER --password=$DATABASE_PASSWORD $DATABASE_NAME < seed/initial-database.sql

