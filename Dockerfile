FROM node:16.15-alpine

WORKDIR /app

# add app
COPY . ./

# start app
CMD ["node", "webserver.js"]

# docker build -t tonip57/webserver --no-cache .
# docker push tonip57/webserver