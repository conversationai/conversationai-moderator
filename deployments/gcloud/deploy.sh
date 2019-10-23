#!/bin/bash
# Use kubectl to deploy the app to the
set -e
set -u

export SQL_CONNECTION=`gcloud sql instances describe $SQL_INSTANCE_NAME --format "value(connectionName)"`

# TODO: May need to destroy secrets first.
kubectl create secret generic cloudsql-instance-credentials --from-file=credentials.json=/cloudsql/key.json
kubectl create secret generic moderator-configuration \
  --from-literal=DATABASE_NAME=$DATABASE_NAME \
  --from-literal=DATABASE_USER=$DATABASE_USER \
  --from-literal=DATABASE_PASSWORD=$DATABASE_PASSWORD \
  --from-literal=GOOGLE_SCORE_AUTH=$GOOGLE_SCORE_AUTH \
  --from-literal=SQL_CONNECTION=$SQL_CONNECTION

envsubst < kubernetes-deployment.yaml | kubectl apply -f -
# TODO: Use a static IP address if one is allocated.
kubectl apply -f kubernetes-networking.yaml





