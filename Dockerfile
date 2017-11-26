FROM quay.io/hotosm/oam-dynamic-tiler-tools

ARG NODE_ENV=production

RUN mkdir -p /app
COPY . /app
WORKDIR /app

RUN npm install

ENV PATH /app/node_modules/.bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
EXPOSE 4000

CMD ["./node_modules/.bin/nf", "start"]
