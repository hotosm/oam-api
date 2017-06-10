FROM quay.io/hotosm/oam-dynamic-tiler-tools

RUN mkdir -p /app
COPY . /app
WORKDIR /app

RUN npm install

EXPOSE 4000

CMD ["./node_modules/.bin/nf", "start"]
