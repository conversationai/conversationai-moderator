FROM gcr.io/google_appengine/nodejs

RUN install_node v8.11.1

WORKDIR /app/
COPY . /app/

RUN npm cache verify

RUN bin/install

EXPOSE 8000 8080

CMD bin/run
