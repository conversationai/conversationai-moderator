# Deploying ConversationAI Moderator to Google Cloud

## Preparing for the deployment

### Install `gcloud`, `docker`, `kubectl` etc.

Instructions for installing gcloud can be found [here](https://cloud.google.com/sdk/docs/quickstart-linux).

You'll find instructions for installing docker in the [root README](../../README.md)

Once you've installed gcloud and docker, run the following commands to prepare
the system for installing moderator:

```bash
gcloud components install kubectl alpha
gcloud auth configure-docker
```

### Create a GCloud project

Before you can do anything else, you need to create a Google Cloud project,
and assign a billing account

There are many instructions on how to do this via the console.  If you want
to do it via the commandline, run the following commands:

```bash
# You can see a list of your billing IDs by running
gcloud alpha billing accounts list

# Set up the project details
PROJECT=<your project ID, e.g., conversationai-moderator-your-name>
REGION=<A region close to home, e.g., europe-west2>
BILLING=<your billing ID>

gcloud projects create $PROJECT --name="Conversation AI Modereator"
gcloud alpha billing projects link $PROJECT --billing-account=$BILLING

gcloud config set project $PROJECT
gcloud config set compute/zone $REGION

# Probably not an exaustive list.  Update if you discover any that are
# missing
gcloud services enable sql-component.googleapis.com sqladmin.googleapis.com
```

### Allocate a domain name and IP address

You will probably want to allocate a domain name and static IP address
for your moderator instance, especially for the production case.  You can
find instructions on how to do this [here](https://cloud.google.com/kubernetes-engine/docs/tutorials/configuring-domain-name-static-ip).

(TODO: not yet integrated with the scripts.  Need to add static IP address as an
environment item, and use it to set up Google OAuth.)

Once you've allocated a hostname and IP address, you'll have enough information
to set the API_URL and FRONTEND_URL environment variables, and to configure
the

### Set up the Google Cloud SQL proxy

During the deployment process, we need to connect to the Google Cloud MySQL
instance to initialise and populate the database.  Also, we'll need access
to provision to proopulate users via the CLI.

To do this, we'll need to create a connection using the cloud SQL proxy.

To create the /cloudsql directory and fetch the cloud_sql_proxy script, run
the following:

```bash
sudo mkdir -p /cloudsql
sudo chmod 777 /cloudsql
wget https://dl.google.com/cloudsql/cloud_sql_proxy.linux.amd64 -O /cloudsql/cloud_sql_proxy
chmod +x /cloudsql/cloud_sql_proxy
```

You'll also need to create a service user with the necessary permissions,
then create a key file with that user's private key:

```bash
SQL_MANAGER=sql-manager

gcloud iam service-accounts create $SQL_MANAGER --display-name "SQL Manager"
gcloud projects add-iam-policy-binding $PROJECT \
   --member serviceAccount:$SQL_MANAGER@$PROJECT.iam.gserviceaccount.com \
   --role roles/cloudsql.client
gcloud iam service-accounts keys create /cloudsql/key.json \
   --iam-account $SQL_MANAGER@$PROJECT.iam.gserviceaccount.com
```

If you want to connect from a different machine, skip this second step.  Instead, once
you have set up the `/cloudsql` directory as described above, just copy the
`/cloudsql/key.json` file into place and you are good to go.

To start the SQL proxy and connect to the database identified by `$SQL_INSTANCE_NAME`,
run the following commands:

```bash
SQL_CONNECTION=`gcloud sql instances describe $SQL_INSTANCE_NAME --format "value(connectionName)"`
/cloudsql/cloud_sql_proxy -dir=/cloudsql -instances=$SQL_CONNECTION -credential_file=/cloudsql/key.json &
```

You'll then be able to access the database via the appropriate socket file in `/cloudsql`, e.g., :

```bash
DATABASE_SOCKET=/cloudsql/$SQL_CONNECTION bin/osmod users:create --group general --name "Name" --email "email@example.com"
mysql --socket=/cloudsql/$SQL_CONNECTION --user=root --password=$DATABASE_PASSWORD
```

## Do the deployment

### Generate a docker file and upload it to a registry

You can skip this step if you've got a prerolled docker image for the moderator.
(You'll need to do this step if you are rolling out a new version.

```bash
MODERATOR_IMAGE_ID=eu.gcr.io/$PROJECT/conversationai-moderator:<version>

cd <root of moderator source tree>
docker build -f deployments/gcloud/Dockerfile -t $MODERATOR_IMAGE_ID .
docker push $MODERATOR_IMAGE_ID
```

You can test out your docker image by running:

```bash
docker run --publish 8080:8080 --publish 8000:8000 \
   --env DATABASE_SOCKET=/cloudsql/$SQL_CONNECTION \
   --env DATABASE_NAME=$DATABASE_NAME \
   --env DATABASE_USER=$DATABASE_USER \
   --env DATABASE_PASSWORD=$DATABASE_PASSWORD \
   --env GOOGLE_SCORE_AUTH=$GOOGLE_SCORE_AUTH \
   --mount type=bind,source=/cloudsql,destination=/cloudsql/
   $MODERATOR_IMAGE_ID
```

You can adjust the above environment settings to connect to the database instance
you require.  The above settings assume you are connecting to the

### Set up an `ENVIRONMENT` file and run the deploy script

Subsequent steps need you to set a large number of parameters.  The easiest way
to do this is to create an environment file.  E.g.,

```
cat > ENVIRONMENT << EOF
export PROJECT=<as set above>
export REGION=<as set above>
export BILLING=<as set above>

export DATABASE_NAME=os_moderator
export DATABASE_USER=os_moderator
export DATABASE_PASSWORD=password
export GOOGLE_SCORE_AUTH=<get this from Jigsaw/Perspective team>
export FRONTEND_URL=http://<hostname or IP address>/
export API_URL=http://<hostname or IP address>:8080/

export MODERATOR_IMAGE_ID=eu.gcr.io/$PROJECT/conversationai-moderator:<version as above>
export SQL_INSTANCE_NAME=conversationai-moderator-db
export SQL_MANAGER=sql-manager
```

### Deploy the MySQL database
Install and configure the MySQL database.

```bash
. ENVIRONMENT
./deploy-sql.sh
```

You'll only need to do this once.

### Deploy the app using Kubernetes

First of all, create your kubernetes cluster.  For normal usage, you only need to
create a cluster with one node.  We assume the cluster is called
`conversationai-moderator`.

```bash
. ENVIRONMENT
gcloud container clusters create conversationai-moderator --num-nodes=1 --region=$REGION
```

Next, deploy the moderator app.  You'll need to rerun this step every time
you want to upgrade the moderator.

```bash
. ENVIRONMENT
./deploy.sh
```

You can see the state of the app in the Kubernetes console, or by running

```bash
kubectl describe deployments conversationai-moderator
```


## TODO:
 - Integrate statically allocated IP address
   e.g., https://cloud.google.com/kubernetes-engine/docs/tutorials/configuring-domain-name-static-ip
 - Separate frontend and api into separate containers?
 - Enable SSH in the load balancer


