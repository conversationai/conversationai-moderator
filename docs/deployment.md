# OSMOD Staging Deployment

The OSMOD is built to run (and be tested) in a Docker environment. The goal is that platform owners will be able to deploy the service wherever they choose, including inside their secure environment.

During the development process, we will be hosting the staging server on Google App Engine using their Flexible environment to deploy to NodeJS Docker image.

Deployment is very simple, using the `gcloud` tool from the `server` folder:

```bash
gcloud app deploy
```

This will build the Docker image, push to Google's Docker Registry and migrate the live traffic from the previous version to the latest.

It is also possible to deploy a release for testing, without routing live traffice to it. Use the `--no-promote` flag for this:

```bash
gcloud app deploy --no-promote
```

When the command finishes, it will print a URL you can use to view this deployment.
