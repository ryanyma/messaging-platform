FROM node:12.16
WORKDIR /app
COPY package-lock.json .
COPY package.json .
RUN npm install 
COPY dist .
COPY wait-for-it.sh .
CMD node index.js