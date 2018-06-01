#!/bin/bash
set -e
set -x
set -u

WD=`dirname $0`

# You need to ensure alpha and beta are available in your gclient
# You need to make sure APIs are enabled

# ***** Things to configure ******

# Friendly name for your GCloud project.
# E.g., conversationai-moderator-<your-name>
#PROJECT=[YOUR-PROJECT-ID]

# A region, e.g., europe-west2
# See https://cloud.google.com/compute/docs/regions-zones/#available
# for a list
#REGION=[YOUR-PREFERRED-REGION]

# Get a list of candidates by running
# gcloud alpha billing accounts list
#BILLING=[YOUR-BILLING-ID]

# Plus set up $DATABASE_NAME, $DATABASE_USER, etc as described in the
# root README

# ***** Create project and assign billing *****

gcloud components install kubectl
gcloud auth configure-docker

gcloud projects create $PROJECT --name="Conversation AI Modereator"
gcloud alpha billing projects link $PROJECT --billing-account=$BILLING

gcloud config set project $PROJECT
gcloud config set compute/zone $REGION
gcloud services enable sql-component.googleapis.com sqladmin.googleapis.com

# ***** Stop here and configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET ****
# Instructions can be found in README

# ***** Create and initialise MySQL  and Redis *****
export SQL_INSTANCE_NAME=conversationai-sql

gcloud sql instances create $SQL_INSTANCE_NAME --region=$REGION --tier=db-g1-small --database-version=MYSQL_5_7
gcloud sql users set-password root % --instance $SQL_INSTANCE_NAME --password $DATABASE_PASSWORD
gcloud sql users create $DATABASE_USER % --instance=$SQL_INSTANCE_NAME --password=$DATABASE_PASSWORD
gcloud sql databases create $DATABASE_NAME --instance=$SQL_INSTANCE_NAME

export SQL_CONNECTION=`gcloud sql instances describe $SQL_INSTANCE_NAME --format "value(connectionName)"`

# Set up SQL proxy on local machine so we can tunnel through the firewall and access the database
sudo mkdir -p /cloudsql
sudo chmod 777 /cloudsql
wget https://dl.google.com/cloudsql/cloud_sql_proxy.linux.amd64 -O /cloudsql/cloud_sql_proxy
chmod +x /cloudsql/cloud_sql_proxy

export SQL_MANAGER=sql-manager
gcloud iam service-accounts create $SQL_MANAGER --display-name "SQL Manager"
gcloud projects add-iam-policy-binding $PROJECT --member serviceAccount:$SQL_MANAGER@$PROJECT.iam.gserviceaccount.com --role roles/cloudsql.client
gcloud iam service-accounts keys create /cloudsql/key.json --iam-account $SQL_MANAGER@$PROJECT.iam.gserviceaccount.com

/cloudsql/cloud_sql_proxy -dir=/cloudsql -instances=$SQL_CONNECTION -credential_file=/cloudsql/key.json &
mysql --socket=/cloudsql/$SQL_CONNECTION --user=root --password=$DATABASE_PASSWORD << EOF
GRANT ALL on $DATABASE_NAME.* to $DATABASE_USER
EOF
mysql --socket=/cloudsql/$SQL_CONNECTION --user=$DATABASE_USER --password=$DATABASE_PASSWORD $DATABASE_NAME < packages/backend-core/seed/initial-database.sql

# ***** Create the docker image for conversationai *****
export MODERATOR_IMAGE_ID=eu.gcr.io/$PROJECT/conversationai-moderator
docker build -f deployments/gcloud/Dockerfile -t $MODERATOR_IMAGE_ID .
docker push $MODERATOR_IMAGE_ID

# Can run docker instance locally using
# docker run --publish 8080:8080 --publish 8000:8000 \
#   --env DATABASE_SOCKET=/cloudsql/$SQL_CONNECTION \
#   --env DATABASE_NAME=$DATABASE_NAME \
#   --env DATABASE_USER=$DATABASE_USER \
#   --env DATABASE_PASSWORD=$DATABASE_PASSWORD \
#   --env GOOGLE_SCORE_AUTH=$GOOGLE_SCORE_AUTH \
#   --env GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID \
#   --env GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET \
#   --env TOKEN_SECRET=$TOKEN_SECRET \
#   --mount type=bind,source=/cloudsql,destination=/cloudsql/
#   conversationai
# Note this uses the SQL proxy socket created
# TODO not sure how to connect Redis.  Maybe connects to local redis?
#                                      Maybe need to set --env REDIS_URL=$REDIS_URL?

# List available containers with
# gcloud container images list --repository=eu.gcr.io/$PROJECT
# ***** create the kubernetes cluster *****

gcloud container clusters create conversationai-moderator --num-nodes=1 --region=$REGION
kubectl create secret generic cloudsql-instance-credentials --from-file=credentials.json=/cloudsql/key.json
kubectl create secret generic moderator-configuration \
  --from-literal=DATABASE_NAME=$DATABASE_NAME \
  --from-literal=DATABASE_USER=$DATABASE_USER \
  --from-literal=DATABASE_PASSWORD=$DATABASE_PASSWORD \
  --from-literal=GOOGLE_SCORE_AUTH=$GOOGLE_SCORE_AUTH \
  --from-literal=GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID \
  --from-literal=GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET \
  --from-literal=TOKEN_SECRET=$TOKEN_SECRET \
  --from-literal=SQL_CONNECTION=$SQL_CONNECTION

# TODO: need to use image genrated above
#    Image in kubernetes-deployment is hardcoded....
envsubst < deployments/gcloud/kubernetes-deployment.yaml | kubectl apply -f -
kubectl apply -f deployments/gcloud/kubernetes-networking.yaml

# View containers with:
kubectl describe deployments conversationai-moderator
# Or view in the gcloud console

# TODO:
# - Aquire a static IP address?
#   e.g., https://cloud.google.com/kubernetes-engine/docs/tutorials/configuring-domain-name-static-ip
# - Aquire a useful domain name?
# - Set FRONTEND_URL and API_URL using domain name?
# - Separate frontend and api into separate containers?
# - Work out how to automate configuration of GOOGLE_CLIENT_*
# - Enable SSH in the load balancer




