const { db } = require('../database');

module.exports = {
  name: 'removewarnings',
  description: 'Remove all warnings for a user',
  options: [
    {
      name: 'user',
      description: 'User to remove warnings for',
      type: 6,
      required: true,
    },
  ],
  async execute(interaction) {
    const authorizedRole = interaction.guild.roles.cache.find(role => role.name === "Authorized");
    if (!interaction.member.roles.cache.has(authorizedRole.id)) {
      return interaction.reply({ content: 'You need the Authorized role to use this command.', ephemeral: true });
    }

    const userToRemoveWarnings = interaction.options.getUser('user');

    // Fetch all warnings for the user
    try {
      const warningsRef = db.collection('warnings').where('user_id', '==', userToRemoveWarnings.id);
      const snapshot = await warningsRef.get();

      // Batch deletion process
      if (!snapshot.empty) {
        const batch = db.batch();
        snapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
        await batch.commit();
      }

      return interaction.reply({ content: `🛑 All warnings for ${userToRemoveWarnings.tag} have been removed.`, ephemeral: true });
    } catch (err) {
      console.error(err);
      return interaction.reply({ content: '❌ An error occurred while removing warnings.', ephemeral: true });
    }
  },
};
