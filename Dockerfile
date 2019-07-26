# dev stage
FROM node:latest as dev-stage
WORKDIR /app
EXPOSE 8681
COPY package*.json ./
RUN npm install
CMD ["npm", "run", "docker:compose"]

# production stage
FROM dev-stage as production-stage
LABEL maintainer="Han Lin <hotdogee@gmail.com>"
COPY . .
CMD ["npm", "run", "start"]
