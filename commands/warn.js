const { db } = require('../database');
const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'warn',
    description: 'Warn a user',
    options: [
        {
            name: 'user',
            description: 'User to warn',
            type: 6,
            required: true,
        },
        {
            name: 'reason',
            description: 'Reason for the warning',
            type: 3,
            required: true,
        },
    ],
    async execute(interaction) {
        const authorizedRole = interaction.guild.roles.cache.find(role => role.name === "Authorized");

        // Check if the user has the Authorized role
        if (!interaction.member.roles.cache.has(authorizedRole.id)) {
            return interaction.reply({ content: 'You need the Authorized role to use this command.', ephemeral: true });
        }

        const userToWarn = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');

        // Add a new warning to the 'warnings' collection
        try {
            await db.collection('warnings').add({
                user_id: userToWarn.id,
                moderator: interaction.user.tag,
                reason: reason,
                timestamp: new Date() // Storing the timestamp of the warning
            });

            // Create a rich embed for the warning
            const warningEmbed = new MessageEmbed()
                .setColor('#FF4500')  // Set the color to orange for warning
                .setTitle(`🔴 Warning Issued`)
                .setThumbnail(userToWarn.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: 'Warned User', value: `${userToWarn.tag} (${userToWarn.id})`, inline: true },
                    { name: 'Moderator', value: interaction.user.tag, inline: true },
                    { name: 'Reason', value: reason }
                )
                .setFooter({ text: 'Warn system', iconURL: interaction.client.user.displayAvatarURL() })
                .setTimestamp();

            interaction.reply({ embeds: [warningEmbed] });
        } catch (err) {
            console.error(err);
            interaction.reply('❌ An error occurred while issuing the warning.');
        }
    },
};