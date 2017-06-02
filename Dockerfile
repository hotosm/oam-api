FROM quay.io/hotosm/oam-dynamic-tiler-tools
ENV NPM_CONFIG_LOGLEVEL warn

# Install app dependencies
ADD package.json /tmp/package.json
RUN cd /tmp && npm install

# Create app directory
RUN mkdir -p /usr/src/app && cp -a /tmp/node_modules /usr/src/app
WORKDIR /usr/src/app

# Bundle app source
ADD . /usr/src/app

# Go ahead and install nodemon for convenience while developing
RUN \
  npm install -g nodemon \
  && rm -rf /root/.npm

# Set TMPDIR environment variable
ENV TMPDIR /tmp

COPY . /app

WORKDIR /app

RUN \
  npm install \
  && rm -rf /root/.npm

EXPOSE 4000

CMD [ "node", "index.js" ]

