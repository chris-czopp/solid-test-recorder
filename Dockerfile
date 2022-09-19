FROM node:16

WORKDIR /src/solid-test-recorder
ADD . /src/solid-test-recorder
RUN yarn install
