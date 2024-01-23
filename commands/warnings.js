const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const { db } = require('../database.js'); // Ensure this points to your Firebase Firestore

module.exports = {
  name: 'warnings',
  description: 'Check the list of warnings for a user',
  options: [
    {
      name: 'user',
      description: 'User to check warnings for',
      type: 6,
      required: true,
    },
  ],

  async execute(interaction, page = 1, userId = null) {
    // This is the command executor, not necessarily the user to check.
    const executor = interaction.member;

    const memberRole = executor.guild.roles.cache.find(role => role.name === "Verified ✅");

    if (!executor.roles.cache.has(memberRole.id)) {
      return interaction.reply({ content: 'You need the Verified ✅ role to use this command.', ephemeral: true });
    }

    const targetUserOption = interaction.options.getUser('user');
    if (!targetUserOption) {
      return interaction.reply({ content: 'You must mention a user to check their warnings.', ephemeral: true });
    }
    const targetUserId = targetUserOption.id;
    const userTagName = targetUserOption.tag;


    const itemsPerPage = 5;
    let query = db.collection('warnings').where('user_id', '==', targetUserId).orderBy('timestamp');

    // Paginate if necessary
    if (page > 1) {
      const lastVisibleSnapshot = await query.limit((page - 1) * itemsPerPage).get();
      const lastVisible = lastVisibleSnapshot.docs[lastVisibleSnapshot.docs.length - 1];
      query = query.startAfter(lastVisible);
    }

    try {
      const pageSnapshot = await query.limit(itemsPerPage).get();

      if (pageSnapshot.empty) {
        return interaction.reply({ content: '🟢 This user has no warnings.', ephemeral: true });
      }

      const totalWarnings = (page - 1) * itemsPerPage + pageSnapshot.size + (pageSnapshot.size === itemsPerPage ? 1 : 0); // This is a trick to estimate total warnings without fetching all
      const warningsList = pageSnapshot.docs.map((doc, index) => {
        const warning = doc.data();
        return `**Warning ${index + 1 + ((page - 1) * itemsPerPage)}**\n👤 Moderator: ${warning.moderator}\n🔎 Reason: ${warning.reason}\n`;
      });

      const embed = new MessageEmbed()
        .setColor('#3498db')
        .setTitle(`User Warnings for ${userTagName}`)
        .setDescription(warningsList.join('\n'))
        .setFooter({ text: `Page ${page} of ${Math.ceil(totalWarnings / itemsPerPage)}` })
        .setTimestamp();

      // Add buttons for pagination if necessary
      const row = new MessageActionRow();
      if (page > 1) {
        row.addComponents(
          new MessageButton()
            .setCustomId(`prev_page:${targetUserId}`)
            .setLabel('Previous Page')
            .setStyle('SECONDARY')
        );
      }

      if (pageSnapshot.size === itemsPerPage) {
        row.addComponents(
          new MessageButton()
            .setCustomId(`next_page:${targetUserId}`)
            .setLabel('Next Page')
            .setStyle('SECONDARY')
        );
      }

      interaction.reply({ embeds: [embed], components: row.components.length ? [row] : [] });
    } catch (err) {
      console.error(err);
      return interaction.reply({ content: '❌ An error occurred while fetching warnings.', ephemeral: true });
    }
  },
};
