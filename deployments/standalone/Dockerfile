FROM ubuntu:bionic

RUN apt update && apt --assume-yes dist-upgrade && apt --assume-yes install mysql-server nodejs npm redis supervisor && npm install -g npm

ENV DATABASE_PASSWORD=$DATABASE_PASSWORD
ENV GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID
ENV GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET

WORKDIR /app

COPY . /app

RUN bin/install

RUN deployments/standalone/initialise_db.sh
