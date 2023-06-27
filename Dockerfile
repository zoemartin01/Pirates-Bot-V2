FROM node:16.17.0

WORKDIR /usr/src/bot
COPY ["package.json", "package-lock.json", "tsconfig.json", ".env", "./"]
COPY ./src ./src
COPY ./prisma ./prisma

RUN npm ci

RUN npx -y prisma generate
CMD npx -y ts-node ./src/bot.ts