import { REST } from "@discordjs/rest";
import { Routes } from "discord.js";
import fs from "node:fs";
import "dotenv/config";
import path from "path";

const commands = [];
const commandFiles = fs
  .readdirSync("./src/commands")
  .filter((file) => file.endsWith(".ts"));

const clientId = process.env.BOT_CLIENT_ID!;

for (const file of commandFiles) {
  const command = require(path.join(__dirname, `commands/${file}`));
  commands.push(command.data.toJSON());
}

const rest = new REST({ version: "10" }).setToken(process.env.BOT_TOKEN!);

(async () => {
  try {
    console.log(
      `Started refreshing ${commands.length} application (/) commands.`
    );

    const data: Array<unknown> = (await rest.put(
      Routes.applicationCommands(clientId),
      {
        body: commands,
      }
    )) as Array<unknown>;

    console.log(
      `Successfully reloaded ${data.length} application (/) commands.`
    );
  } catch (error) {
    console.error(error);
  }
})();
