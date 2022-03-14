FROM node:16-alpine3.14
COPY . .
RUN ['npm', 'install']
ENTRYPOINT ['npm', 'start']
