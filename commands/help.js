const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');

const commands = [
    { name: '/verify', description: 'Link your Roblox account to your Discord account.' },
    { name: '/update', description: 'Update your Discord roles based on your Roblox roles.' },
    { name: '/profile', description: 'Calls certain details about that user\'s Roblox profile' },
    { name: '/purge', description: 'Deletes 0-99 messages based on your preferences (a command used by authorities only).' },
    { name: '/warn', description: 'Warns a rule breaker. (a command used by authorities only)' },
    { name: '/warnings', description: 'A command used to view your warnings.' },
    { name: '/removewarning', description: 'Deletes a specific warning based on its ID (a command used by authorities only).' },
    { name: '/removewarnings', description: 'Clears all warnings of that user (a command used by authorities only).' },
    { name: '/setmessages', description: 'Used to add messages for the leveling system in case of data loss (a command used by authorities only).' },
    { name: '/setmessages', description: 'Used to add messages for the leveling system in case of data loss (a command used by authorities only).' },
    //... other commands you might have, for demonstration purposes
];

module.exports = {
    name: 'help',
    description: 'List all available commands and their descriptions.',
    async execute(interaction, page = 1) {
        const commandsPerPage = 5;
        const totalPages = Math.ceil(commands.length / commandsPerPage);

        // Clamp the page to a valid value
        page = Math.max(1, Math.min(page, totalPages));

        const start = (page - 1) * commandsPerPage;
        const end = start + commandsPerPage;

        const embed = new MessageEmbed()
            .setTitle("**RVStudios**")
            .setDescription("Welcome to the RVStudios bot! For issues, please reach out to one of our authorities. Below, you may look at some of the commands we have currently.")
            .setColor("#3498db")
            .setFooter({text:`Page ${page} of ${totalPages}`});

        const row = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('prev_page_help')
                    .setLabel('Previous')
                    .setStyle('PRIMARY')
            )
            .addComponents(
                new MessageButton()
                    .setCustomId('next_page_help')
                    .setLabel('Next')
                    .setStyle('PRIMARY')
            );

        // Send the initial message with components
        const initialFields = [];
        for (let i = start; i < end && i < commands.length; i++) {
            initialFields.push({
                name: commands[i].name,
                value: commands[i].description,
            });
        }
        embed.addFields(initialFields);

        await interaction.reply({ embeds: [embed], components: [row] });

        // Handle button clicks
        const filter = (i) => i.customId.startsWith('prev_page_help') || i.customId.startsWith('next_page_help');
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async (i) => {
            const interactionId = i.customId;
            if (interactionId === 'next_page_help' && page < totalPages) {
                page += 1;
            } else if (interactionId === 'prev_page_help' && page > 1) {
                page -= 1;
            }

            // Update the content and button row
            const fields = [];
            for (let i = (page - 1) * commandsPerPage; i < page * commandsPerPage && i < commands.length; i++) {
                fields.push({
                    name: commands[i].name,
                    value: commands[i].description,
                });
            }
            embed.setFields(fields);
            embed.setFooter(`Page ${page} of ${totalPages}`);

            // Update the row components
            row.components[0].setDisabled(page === 1);
            row.components[1].setDisabled(page === totalPages);

            await i.update({ embeds: [embed], components: [row] }).catch(console.error);
        });

        collector.on('end', () => {
            // Remove buttons or perform other cleanup if needed
            row.components.forEach(component => {
                component.setDisabled(true);
            });
            interaction.editReply({ components: [row] }).catch(console.error);
        });
    }
};