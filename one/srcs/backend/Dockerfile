FROM node:24.20.0

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

CMD ["bash", "./docker-entrypoint.sh"]
