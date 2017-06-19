FROM gcr.io/google_appengine/nodejs

RUN install_node v6.11.0

COPY . /app/

RUN npm install --unsafe-perm

EXPOSE 8080

CMD npm start
