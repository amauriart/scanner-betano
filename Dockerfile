FROM node:18-slim

WORKDIR /app
COPY . .

RUN apt-get update && apt-get install -y wget ca-certificates fonts-liberation         libx11-xcb1 libxcomposite1 libxcursor1 libxdamage1 libxrandr2 libgbm1 libasound2         libatk1.0-0 libcups2 libdrm2 libatspi2.0-0 libnspr4 libnss3 libxss1 chromium         && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

RUN npm install --no-audit --no-fund

EXPOSE 3000
CMD ["npm", "start"]
