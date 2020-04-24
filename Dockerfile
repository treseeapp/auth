FROM node:10
WORKDIR /usr/src/node
COPY package.json ./
COPY ./dist/ ./
RUN npm install
EXPOSE 3000
CMD ["node", "App.js"]