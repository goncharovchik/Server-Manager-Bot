FROM node:18-alpine

WORKDIR /app

# Устанавливаем util-linux для nsenter (выполнение команд на хосте)
RUN apk add --no-cache util-linux

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

RUN mkdir -p logs

USER root

CMD ["node", "src/bot.js"]
