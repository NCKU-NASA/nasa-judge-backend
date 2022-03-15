FROM node:14
COPY . .
EXPOSE 3000

RUN ["npm", "install"]

ENTRYPOINT ["./wait-for-it.sh", "mysql:3306", "-s", "-t", "100", "--", "npm", "start"]
