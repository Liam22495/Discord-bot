const { Permissions } = require('discord.js');

module.exports = {
  name: 'purge',
  description: 'Delete a specified number of messages',
  options: [
    {
      name: 'amount',
      description: 'Number of messages to delete (1-100)',
      type: 4,
      required: true,
    },
  ],
  async execute(interaction) {
    const authorizedRole = interaction.guild.roles.cache.find(role => role.name === "Authorized");
    if (!interaction.member.roles.cache.has(authorizedRole.id)) {
      return interaction.reply({ content: 'You need the Authorized role to use this command.', ephemeral: true });
    }

    const amount = interaction.options.getInteger('amount');

    if (isNaN(amount) || amount <= 0 || amount > 100) {
      return interaction.reply('❌ Please provide a valid number between 1 and 100.');
    }

    try {
      const channel = interaction.channel;
      const messages = await channel.messages.fetch({ limit: amount });
      await channel.bulkDelete(messages);

      return interaction.reply({ content: `✅ Successfully deleted ${amount} messages.`, ephemeral: true });
    } catch (error) {
      console.error(error);
      return interaction.reply({ content: '❌ An error occurred while deleting messages.', ephemeral: true });
    }
  },
};
