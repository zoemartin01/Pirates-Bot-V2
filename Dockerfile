FROM node:16.17.0

WORKDIR /usr/src/bot
COPY ["package.json", "package-lock.json", "tsconfig.json", ".env", "./"]
COPY ./src ./src

RUN npm ci

RUN npx -y ts-node ./src/reload_commands.ts
CMD npx -y ts-node ./src/bot.ts