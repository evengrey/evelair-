FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* yarn.lock* ./
RUN npm install --legacy-peer-deps || yarn install --frozen-lockfile
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
