# This base adds libvips, needed by the sharp library, to the ubuntu:14.04 image
FROM marcbachmann/libvips:8.0.2

ENV DEBIAN_FRONTEND noninteractive

# Install base dependencies
RUN \
  apt-get update && \
  apt-get upgrade -y && \
  apt-get install -y -q --no-install-recommends \
    apt-transport-https \
    build-essential \
    ca-certificates \
    curl \
    git \
    libssl-dev \
    python \
    software-properties-common \
  && curl -sf https://deb.nodesource.com/gpgkey/nodesource.gpg.key | apt-key add - \
  && add-apt-repository -s "deb https://deb.nodesource.com/node_4.x $(lsb_release -c -s) main" \
  && apt-get update \
  && apt-get install --no-install-recommends -y nodejs \
  && rm -rf /var/lib/apt/lists/* \
  && apt-get clean

# Go ahead and install nodemon for convenience while developing
RUN \
  npm install -g nodemon \
  && rm -rf /root/.npm

# Set TMPDIR environment variable
ENV TMPDIR /tmp

# copy install, test, run, etc. scripts for convenient access
COPY *.sh /
