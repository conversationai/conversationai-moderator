# Local Application

## Requirements
1. [Docker](https://www.docker.com/)
2. [Docker-Compose](https://docs.docker.com/compose/)

## Starting the application
1. Run
```sh
./bin/start.sh --email "your@email.com" --name "Your Name"
```

`start.sh` starts a docker-composed database, redis and single application (with frontend, worker and api). It then runs migrations and creates a user.

## Stopping the application
1. Run
```sh
./bin/stop.sh
```

`stop.sh` removes the database files and kills the running docker-compose instance.
