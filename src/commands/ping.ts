import {
  CacheType,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";

const data = new SlashCommandBuilder().setName("ping").setDescription("Pong!");

const command = async (interaction: ChatInputCommandInteraction<CacheType>) => {
  await interaction.reply("Pong!");
};

export { data, command };
