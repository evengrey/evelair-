FROM node:20-alpine
WORKDIR /app
COPY package.json ./
COPY tsconfig.json ./
COPY next.config.js ./
COPY postcss.config.js ./
COPY tailwind.config.js ./
COPY *.d.ts ./
RUN npm install
COPY app ./app
CMD ["npm", "run", "dev"]
