import {
  CacheType,
  ChatInputCommandInteraction,
  EmbedBuilder,
  Interaction,
  InteractionType,
  Message,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { DeepPartial } from "typeorm";
import { AppDataSource } from "../data-source";
import { AutoResponse } from "../entity/autoresponse";

const data = new SlashCommandBuilder()
  .setName("ar")
  .setDescription("Automated responses!")
  .setDMPermission(false)
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  // add subcommand
  .addSubcommand((add) =>
    add
      .setName("add")
      .setDescription("Add a response")
      .addStringOption((trigger) =>
        trigger
          .setName("trigger")
          .setDescription("The trigger to respond to")
          .setRequired(true)
      )
      .addStringOption((response) =>
        response
          .setName("response")
          .setDescription("The response to send")
          .setRequired(true)
      )
      .addStringOption((triggerType) =>
        triggerType
          .setName("type")
          .setDescription("The trigger type")
          .setRequired(true)
          .addChoices(
            { name: "Strict", value: "strict_contains" },
            { name: "Exact", value: "exact" },
            { name: "Contains", value: "contains" },
            { name: "Starts With", value: "starts_with" },
            { name: "Ends With", value: "ends_with" }
          )
      )
  )
  // remove subcommand
  .addSubcommand((remove) =>
    remove
      .setName("remove")
      .setDescription("Remove a response")
      .addStringOption((trigger) =>
        trigger
          .setName("trigger")
          .setDescription("The trigger to remove")
          .setAutocomplete(true)
          .setRequired(true)
      )
  )
  // list subcommand
  .addSubcommand((list) =>
    list.setName("list").setDescription("List all responses")
  );

const list = async (interaction: ChatInputCommandInteraction<CacheType>) => {
  const repository = AppDataSource.getRepository(AutoResponse);
  const guild = interaction.guildId!;

  const responses = await repository.findBy({ guild });
  const embed = new EmbedBuilder()
    .setTitle("AutoResponse List")
    .setDescription(
      responses.length > 0
        ? responses
            .map(
              (response) =>
                `${response.trigger} - ${response.response} | ${response.triggerType}`
            )
            .join("\n")
        : "No responses found"
    );

  interaction.reply({
    embeds: [embed],
  });
};

const add = async (interaction: ChatInputCommandInteraction<CacheType>) => {
  const repository = AppDataSource.getRepository(AutoResponse);

  const response = interaction.options.getString("response", true);
  const trigger = interaction.options.getString("trigger", true);
  const triggerType = interaction.options.getString("type", true);
  const guild = interaction.guildId!;

  repository.save(<DeepPartial<AutoResponse>>{
    response,
    trigger,
    triggerType,
    guild,
  });

  await interaction.reply({
    content: `Added Trigger \`${trigger}\`!`,
    ephemeral: true,
  });
};

const remove = async (interaction: Interaction<CacheType>) => {
  if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
    const repository = AppDataSource.getRepository(AutoResponse);
    const guild = interaction.guildId!;

    const focusedValue = interaction.options.getFocused();
    const responses = await repository.findBy({ guild });
    const filtered = responses.filter((response) =>
      response.trigger.startsWith(focusedValue)
    );
    await interaction.respond(
      filtered.map((choice) => ({
        name: choice.trigger,
        value: choice.trigger,
      }))
    );
  } else if (interaction.isChatInputCommand()) {
    const repository = AppDataSource.getRepository(AutoResponse);
    const guild = interaction.guildId!;
    const trigger = interaction.options.getString("trigger", true);

    const entry = await repository.findOneBy({ guild, trigger });

    if (!entry) {
      await interaction.reply({ content: "No entry found!", ephemeral: true });
    } else {
      await repository.remove(entry);
      await interaction.reply({
        content: `Removed Trigger \`${trigger}\`!`,
        ephemeral: true,
      });
    }
  }
};

const command = async (interaction: ChatInputCommandInteraction<CacheType>) => {
  if (interaction.options.getSubcommand() === "add") {
    await add(interaction);
  } else if (interaction.options.getSubcommand() === "remove") {
    await remove(interaction);
  } else if (interaction.options.getSubcommand() === "list") {
    await list(interaction);
  }
};

const autocomplete = async (interaction: Interaction<CacheType>) => {
  // autocomplete
  if (interaction.type !== InteractionType.ApplicationCommandAutocomplete)
    return;
  if (interaction.options.getSubcommand() === "remove")
    await remove(interaction);
};

const messageHandler = async (message: Message<boolean>) => {
  const repository = AppDataSource.getRepository(AutoResponse);
  const guild = message.guildId!;

  const responses = await repository.findBy({ guild });
  const filtered = responses.filter((response) => {
    if (response.triggerType === "strict_contains") {
      return message.content.match(
        new RegExp(
          "[\\S\\s]*(?<!\\S)" +
            response.trigger.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") +
            "(?!\\S)[\\S\\s]*",
          "gi"
        )
      );
    } else if (response.triggerType === "exact") {
      return response.trigger.toLowerCase() === message.content.toLowerCase();
    } else if (response.triggerType === "contains") {
      return message.content
        .toLowerCase()
        .includes(response.trigger.toLowerCase());
    } else if (response.triggerType === "starts_with") {
      return message.content
        .toLowerCase()
        .startsWith(response.trigger.toLowerCase());
    } else if (response.triggerType === "ends_with") {
      return message.content
        .toLowerCase()
        .endsWith(response.trigger.toLowerCase());
    }
  });

  filtered.forEach(async (response) => await message.reply(response.response));
};

export { data, command, messageHandler, autocomplete };
