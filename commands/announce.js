const { MessageActionRow, MessageSelectMenu } = require('discord.js');

module.exports = {
    name: 'announce',
    description: 'Send an announcement to everyone, a role, or a specific user via direct messages.',
    options: [
        {
            name: 'target',
            description: 'Select the announcement target.',
            type: 3, // String
            required: true,
            choices: [
                { name: 'Everyone', value: 'everyone' },
                { name: 'Specific Role', value: 'role' },
                { name: 'Specific User', value: 'user' },
                { name: 'Users without Specific Role', value: 'without_role' },
            ],
        },
        {
            name: 'message',
            description: 'The announcement message.',
            type: 3, // String
            required: true,
        },
        {
            name: 'user',
            description: 'Mention the user to send the announcement to (required for specific user selection).',
            type: 6, // User
            required: false,
        },
        {
            name: 'role',
            description: 'Mention the role to send the announcement to (required for specific role selection).',
            type: 8, // Role
            required: false,
        },
    ],
    async execute(interaction) {
        try {
            // Defer the interaction immediately
            await interaction.deferReply({ ephemeral: true });

            // Only allow specific users to execute this command
            const allowedUserIds = ['249204177748754432']; // Easily add more IDs by comma separating inside the array.
            if (!allowedUserIds.includes(interaction.user.id)) {
                return interaction.editReply("You're not authorized to use this command.");
            }

            const target = interaction.options.getString('target');
            const role = interaction.options.getRole('role');
            const user = interaction.options.getUser('user');
            const messageContent = interaction.options.getString('message');
            let delay = 0;
            const sentToUsers = [];
            const failedToSendToUsers = [];

            const sendAnnouncementToUser = async (user, message) => {
                try {
                    await user.send(message);
                    sentToUsers.push(user.tag);
                } catch (error) {
                    console.error(`Failed to send announcement to ${user.tag}: ${error.message}`);
                    failedToSendToUsers.push(user.tag);
                }
            };

            if (target === 'everyone') {
                const guild = interaction.guild;
                if (!guild) {
                    return interaction.editReply('This command can only be used in a server.');
                }

                const members = await guild.members.fetch();
                for (const [, member] of members) {
                    setTimeout(() => {
                        sendAnnouncementToUser(member.user, messageContent);
                    }, delay);
                    delay += 2000;
                }

            } else if (target === 'role' && role) {
                const membersWithRole = role.members;
                membersWithRole.forEach(member => {
                    setTimeout(() => {
                        sendAnnouncementToUser(member.user, messageContent);
                    }, delay);
                    delay += 2000;
                });
            } else if (target === 'without_role' && role) {
                const guild = interaction.guild;
                const allMembers = await guild.members.fetch();
                const membersWithoutRole = allMembers.filter(member => !member.roles.cache.has(role.id));

                membersWithoutRole.forEach(member => {
                    setTimeout(() => {
                        sendAnnouncementToUser(member.user, messageContent);
                    }, delay);
                    delay += 1000;
                });

            } else if (target === 'user' && user) {
                await sendAnnouncementToUser(user, messageContent);
            } else {
                return interaction.editReply('Invalid target, role, or user.');
            }

            // Summary response after processing all users
            let replyMessage = `Announcement process completed.`;
            if (sentToUsers.length > 0) {
                replyMessage += `\nSuccessfully sent to: ${sentToUsers.join(', ')}.`;
            }
            if (failedToSendToUsers.length > 0) {
                replyMessage += `\nFailed to send to: ${failedToSendToUsers.join(', ')}.`;
            }

            // Edit the deferred reply with the summary
            setTimeout(() => interaction.editReply(replyMessage), delay + 2000);
        } catch (error) {
            console.error("Error in announce command:", error);
            interaction.editReply({ content: "An error occurred. Please check the console.", ephemeral: true });
        }
    },
};
