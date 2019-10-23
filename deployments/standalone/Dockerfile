FROM ubuntu:bionic

RUN apt update && apt --assume-yes dist-upgrade && apt --assume-yes install mysql-server nodejs npm redis supervisor && npm install -g npm

ENV DATABASE_PASSWORD=$DATABASE_PASSWORD

WORKDIR /app

COPY . /app

RUN bin/install

RUN deployments/standalone/initialise_db.sh
