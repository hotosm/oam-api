FROM quay.io/hotosm/oam-dynamic-tiler-tools

ENV DEBIAN_FRONTEND noninteractive

# Go ahead and install nodemon for convenience while developing
RUN \
  npm install -g nodemon \
  && rm -rf /root/.npm

# Set TMPDIR environment variable
ENV TMPDIR /tmp

COPY package.json /app/package.json

WORKDIR /app

RUN \
  npm install \
  && rm -rf /root/.npm

EXPOSE 4000

COPY . /app

ENTRYPOINT ["npm", "start"]
