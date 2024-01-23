const { db } = require('../database'); // Ensure this points to your Firebase Firestore

module.exports = {
  name: 'removewarning',
  description: 'Remove a warning for a user',
  options: [
    {
      name: 'user',
      description: 'User to remove warning for',
      type: 6,
      required: true,
    },
    {
      name: 'warning_index',
      description: 'Index of the warning to remove (1 for the first warning, etc.)',
      type: 4, // This type is for INTEGER
      required: true,
    },
  ],
  async execute(interaction) {
    const authorizedRole = interaction.guild.roles.cache.find(role => role.name === "Authorized");
    if (!interaction.member.roles.cache.has(authorizedRole.id)) {
      return interaction.reply({ content: 'You need the Authorized role to use this command.', ephemeral: true });
    }

    const userToRemoveWarning = interaction.options.getUser('user');
    const warningIndex = interaction.options.getInteger('warning_index') - 1; // Adjust for zero-based index

    try {
      // Fetch all warnings for the user from Firestore
      const warningsRef = db.collection('warnings').where('user_id', '==', userToRemoveWarning.id).orderBy('timestamp');
      const snapshot = await warningsRef.get();

      if (snapshot.empty || warningIndex < 0 || warningIndex >= snapshot.size) {
        return interaction.reply({ content: '❌ Warning not found or index is out of bounds.', ephemeral: true });
      }

      // Get the document reference of the warning by index
      const warningDocRef = snapshot.docs[warningIndex].ref;

      // Delete the warning
      await warningDocRef.delete();
      return interaction.reply({ content: `🛑 Warning number ${warningIndex + 1} for ${userToRemoveWarning.tag} has been removed.`, ephemeral: true });
    } catch (err) {
      console.error(err);
      return interaction.reply({ content: '❌ An error occurred while removing the warning. Please try again later.', ephemeral: true });
    }
  },
};
