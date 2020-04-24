FROM node:10
WORKDIR /usr/src/node
COPY package.json ./
COPY ./.env ./
COPY ./dist/ ./
COPY ./node_modules ./node_modules
EXPOSE 3000
CMD ["node", "App.js"]