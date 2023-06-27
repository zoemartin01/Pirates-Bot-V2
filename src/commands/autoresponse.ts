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
import { prisma } from "../db";
import { AutoresponseTriggerType } from "@prisma/client";

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
            { name: "Strict", value: "STRICT_CONTAINS" },
            { name: "Exact", value: "EXACT" },
            { name: "Contains", value: "CONTAINS" },
            { name: "Starts With", value: "STARTS_WITH" },
            { name: "Ends With", value: "ENDS_WITH" }
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
  const guild = interaction.guildId!;

  const responses = await prisma.autoresponse.findMany({ where: { guild } });
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
  const response = interaction.options.getString("response", true);
  const trigger = interaction.options.getString("trigger", true);
  const triggerType = interaction.options.getString(
    "type",
    true
  ) as AutoresponseTriggerType;
  const guild = interaction.guildId!;

  await prisma.autoresponse.create({
    data: {
      response,
      trigger,
      triggerType,
      guild,
    },
  });

  await interaction.reply({
    content: `Added Trigger \`${trigger}\`!`,
    ephemeral: true,
  });
};

const remove = async (interaction: Interaction<CacheType>) => {
  if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
    const guild = interaction.guildId!;

    const focusedValue = interaction.options.getFocused();
    const responses = await prisma.autoresponse.findMany({ where: { guild } });
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
    const guild = interaction.guildId!;
    const trigger = interaction.options.getString("trigger", true);

    const entry = await prisma.autoresponse.findFirst({
      where: { guild, trigger },
    });

    if (!entry) {
      await interaction.reply({ content: "No entry found!", ephemeral: true });
    } else {
      await prisma.autoresponse.delete({ where: { id: entry.id } });
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
  const guild = message.guildId!;

  const responses = await prisma.autoresponse.findMany({ where: { guild } });
  const filtered = responses.filter((response) => {
    if (response.triggerType === "STRICT_CONTAINS") {
      return message.content.match(
        new RegExp(
          "[\\S\\s]*(?<!\\S)" +
            response.trigger.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") +
            "(?!\\S)[\\S\\s]*",
          "gi"
        )
      );
    } else if (response.triggerType === "EXACT") {
      return response.trigger.toLowerCase() === message.content.toLowerCase();
    } else if (response.triggerType === "CONTAINS") {
      return message.content
        .toLowerCase()
        .includes(response.trigger.toLowerCase());
    } else if (response.triggerType === "STARTS_WITH") {
      return message.content
        .toLowerCase()
        .startsWith(response.trigger.toLowerCase());
    } else if (response.triggerType === "ENDS_WITH") {
      return message.content
        .toLowerCase()
        .endsWith(response.trigger.toLowerCase());
    }
  });

  filtered.forEach(async (response) => await message.reply(response.response));
};

export { data, command, messageHandler, autocomplete };
