FROM gcr.io/google_appengine/nodejs

RUN install_node v8.11.1

WORKDIR /app/
COPY . /app/

RUN npm cache verify
RUN find . -name node_modules -exec rm -Rf {} \; && find . -name package-lock.json -exec rm -Rf {} \;

RUN bin/install

EXPOSE 8080
EXPOSE 8000

CMD bin/watch
