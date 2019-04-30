FROM gcr.io/google_appengine/nodejs

RUN install_node v8.11.1 && apt update && apt dist-upgrade -y && apt install -y mysql-client

WORKDIR /app/
COPY . /app/

RUN npm cache verify && bin/install

EXPOSE 80 80

CMD bin/run
