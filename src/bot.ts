import { Client, GatewayIntentBits } from "discord.js";
import "dotenv/config";
import "reflect-metadata";
import * as ping from "./commands/ping";
import * as autoresponse from "./commands/autoresponse";
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
  ],
});

client.on("ready", () => {
  console.log(`Logged in as ${client.user!.tag}!`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  await autoresponse.messageHandler(message);
});

client.on("interactionCreate", async (interaction) => {
  if (interaction.isAutocomplete()) {
    if (interaction.commandName === "ar") {
      await autoresponse.autocomplete(interaction);
    }
  }

  if (!interaction.isChatInputCommand()) return;

  switch (interaction.commandName) {
    case "ping":
      await ping.command(interaction);
      break;

    case "ar":
      await autoresponse.command(interaction);
      break;

    default:
      break;
  }
});

client.login(process.env.BOT_TOKEN);
