const {
  Client,
  Intents,
  MessageEmbed,
  MessageActionRow,
  MessageButton,
  WebhookClient,
} = require("discord.js");

const fs = require("fs");
const axios = require("axios");
const path = require("path");
const { token } = require("./config.json");
const {
  initializeMemberRoles,
  incrementUserMessages,
} = require("./utilities/messageHandler");

const possibleTopics = [
  '**Support team**: Will direct you to the support team, you will still recive the messages here. To end the conversation you will need to write "end-chat".',
  "**Rules**: Explains the rules",
  "**What is RVStudios**: Explains about RVStudios",
  "**Bot creator**: replies with the bot creator",
  // ... add more topics/questions as needed ...
];

const supportChatUsers = new Set();

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.DIRECT_MESSAGES, // Add this line
  ],
  partials: ["MESSAGE", "CHANNEL", "REACTION"],
});

client.commands = new Map();

const commandFiles = fs
  .readdirSync("./commands")
  .filter((file) => file.endsWith(".js"));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.name, command);
}

require("./utilities/reactions")(client);

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
  client.guilds.cache.each((guild) => {
    initializeMemberRoles(guild);
  });

  // Register the commands upon startup
  require('./registerCommands.js')(client);
});

client.on("interactionCreate", async (interaction) => {
  if (interaction.isCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    if (interaction.type === "AUTOCOMPLETE") {
      // Handle the autocomplete interaction type
      if (typeof command.autocompleteHandler === "function") {
        return command.autocompleteHandler(interaction);
      }
    } else {
      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(error);
        interaction.reply({
          content: "An error occurred while executing the command.",
          ephemeral: true,
        });
      }
    }
  } else if (interaction.isButton()) {
    const [action, commandName] = interaction.customId.split("_");

    // For warnings command
    if (commandName === "page_warnings") {
      const footerText = interaction.message.embeds[0].footer.text;
      const currentPageMatch = footerText.match(/Page (\d+) of/);

      if (!currentPageMatch) return;
      let currentPage = parseInt(currentPageMatch[1], 10);

      const command = client.commands.get("warnings");
      if (action === "next") {
        await command.execute(interaction, currentPage + 1);
      } else if (action === "prev" && currentPage > 1) {
        await command.execute(interaction, currentPage - 1);
      }
    }

    // For hangman command
    if (commandName === "hangman") {
      const command = client.commands.get("hangman");
      if (command) {
        // You can handle the interaction here, or call a method from your command object.
        await command.handleButtonInteraction(interaction, action);
      }
    }

    // For help command
    if (commandName === "page_help") {
      const footerText = interaction.message.embeds[0].footer.text;
      const currentPageMatch = footerText.match(/Page (\d+) of/);

      if (!currentPageMatch) return;
      let currentPage = parseInt(currentPageMatch[1], 10);

      const command = client.commands.get("help");
      if (action === "next") {
        await command.execute(interaction, currentPage + 1);
      } else if (action === "prev" && currentPage > 1) {
        await command.execute(interaction, currentPage - 1);
      }
    }
  }
});

// Webhook for automated messaging system
const webhookURL =
  "https://discord.com/api/webhooks/1161281106339971102/Oy89fWMrv4M93X4yOFlfbYqmJ8mvjAhewM8XdeLgoqjH_5tCxauu3s5Q-nYow3qcU0lo"; // Replace with your webhook URL
const [webhookId, webhookToken] = webhookURL.split("/").slice(-2);
const webhookClient = new WebhookClient({ id: webhookId, token: webhookToken });

// Predefined responses
const predefinedResponses = {
  "What's the rules":
    "1. Don't be a know it all, 2. Don't be a D### h###, 3. Have fun. ",
  "bot creator":
    "Liamx1ty is the bot creator and host for RVStudios, if you have any suggestions they are more than happy to listen and possibly add it to the bot.",
  "what is RVStudios":
    "I'm just a bot, so I don't have feelings, but thanks for asking!",
  // ... add more predefined responses as needed ...
};

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  incrementUserMessages(message.author.id, message.guild);

  if (
    message.channel.type === "DM" &&
    message.author.id === "249204177748754432" &&
    message.attachments.size > 0
  ) {
    const attachment = message.attachments.first();
    const filePath = path.join(__dirname, "SentFiles", attachment.name);

    // Use axios to download and save the file
    axios
      .get(attachment.url, { responseType: "stream" })
      .then((response) => {
        const writeStream = fs.createWriteStream(filePath);
        response.data.pipe(writeStream);

        writeStream.on("finish", () => {
          console.log(`File saved to ${filePath}`);
          message.reply("File saved successfully!");
        });

        writeStream.on("error", (error) => {
          console.error("Error writing file:", error);
          message.reply("Error saving the file. Please try again later.");
        });
      })
      .catch((error) => {
        console.error("Error fetching file:", error);
        message.reply("Error fetching the file. Please try again later.");
      });
  }

  if (message.channel.type === "DM") {
    let botResponse;

    const userMessageLower = message.content.toLowerCase();

    if (supportChatUsers.has(message.author.id)) {
      // Check for "end-chat" command
      if (userMessageLower === "end-chat") {
        botResponse =
          "Thank you for reaching out, please send your feedback to Liamx1ty, good day!";
        supportChatUsers.delete(message.author.id);
        const embedResponse = new MessageEmbed()
          .setColor("#0099ff")
          .setTitle("Response")
          .setDescription(botResponse)
          .setTimestamp()
          .setFooter({
            text: 'If the answer was not helpful respond with, "Support team." and our support team will get back to you. ',
            iconURL: client.user.displayAvatarURL(),
          });
        await message.author.send({ embeds: [embedResponse] });
      } else {
        // Fetch the last 10 messages from the DM and find the latest one sent by the bot
        const fetchedMessages = await message.channel.messages.fetch({
          limit: 10,
        });
        const lastBotMessage = fetchedMessages.find((m) => m.author.bot);
        if (lastBotMessage) {
          botResponse =
            lastBotMessage.content || "No text content (could be an embed)";
        } else {
          botResponse = "No recent bot messages found";
        }
      }
    } else {
      if (userMessageLower === "support team") {
        botResponse =
          'Directing you to the support team, in the meantime please state further details to help us understand what you need. You may end this chat at anytime by typing "end-chat".';
        supportChatUsers.add(message.author.id);
      } else if (predefinedResponses[userMessageLower]) {
        botResponse = predefinedResponses[userMessageLower];
      } else {
        botResponse = `Hello! Check out the list of quick responses bellow. Or jump to live chat by responding with Support team!.\n\n **Here are a list of common questions:**\n\n${possibleTopics.join(
          "\n\n"
        )}`;
      }

      // Send response to the user for non-support chat messages
      const embedResponse = new MessageEmbed()
        .setColor("#0099ff")
        .setTitle("Hello, I hope this helps!")
        .setDescription(botResponse)
        .setTimestamp()
        .setFooter({
          text: 'You may also try out our live chat by typing "Support team".',
          iconURL: client.user.displayAvatarURL(),
        });
      await message.author.send({ embeds: [embedResponse] });
    }

    if (!message.content.trim() || !botResponse.trim()) {
      console.error("User Message or Bot Response is empty!");
      return;
    }

    // Send the user's message and the bot's response (or placeholder) to the webhook
    const webhookEmbed = new MessageEmbed()
      .setColor("#0099ff")
      .setAuthor({
        name: message.author.tag,
        iconURL: message.author.displayAvatarURL(),
      })
      .addFields(
        { name: "User Message", value: message.content },
        { name: "Bot Response", value: botResponse }
      )
      .setTimestamp()
      .setFooter({
        text: "Use /announce user message to reply if a custom message is triggered",
        iconURL: client.user.displayAvatarURL(),
      });

    webhookClient.send({ embeds: [webhookEmbed] });
  }
});

// Add the new member welcome system
client.on("guildMemberAdd", (member) => {
  const welcomeChannel = member.guild.channels.cache.get("1148334688306483331");
  if (!welcomeChannel) return;

  const welcomeEmbed = new MessageEmbed()
    .setColor("#0099ff")
    .setTitle("Welcome to RVStudios!")
    .setDescription(
      `Hello ${member}, welcome to Gulag! If you're new here, go over the rules and have fun.`
    )
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .setTimestamp()
    .setFooter({ text: "Gulag welcomes you!" });

  welcomeChannel.send({ embeds: [welcomeEmbed] });
});

client.login(token);
