FROM node:10
WORKDIR /usr/src/node
COPY package.json ./
RUN npm install
COPY /home/migue/.env ./
COPY ./dist/ ./
EXPOSE 3000
CMD ["node", "App.js"]
