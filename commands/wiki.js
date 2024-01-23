const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');

const itemsDatabase = {
    'Dank': 'Dank is the owner and founder of the Roblox group RVStudios.',
    'Bunny': 'Bunny is the pro developer of the Roblox group RVStudios.',
    'Liamx1ty': 'Liamx1ty is the god of the group.',
    // Add more items here
};

const itemsPerPage = 3; // Number of items to display per page

module.exports = {
    name: 'wiki',
    description: 'Get information about an item or list available items.',
    options: [
        {
            name: 'item_name',
            type: 3, // String type
            description: 'Name of the item you want information about.',
            required: false, // Make this option optional
        },
    ],

    async execute(interaction) {
        const itemName = interaction.options.getString('item_name');

        try {
            // User provided an item name
            if (itemName) {
                const formattedItemName = capitalizeFirstLetter(itemName.toLowerCase());
                const itemDetails = itemsDatabase[formattedItemName];

                if (itemDetails) {
                    const embed = new MessageEmbed()
                        .setColor('#3498db')
                        .setTitle(`Details for ${formattedItemName}`)
                        .setDescription(itemDetails);

                    return interaction.reply({ embeds: [embed] });
                } else {
                    // Item doesn't exist, send a message instead of an embed
                    return interaction.reply({
                        content: `Sorry, the item "${formattedItemName}" is not available, please type /wiki to see the list of available items.`,
                        ephemeral: true,
                    });
                }
            }

            // List available items if the user didn't provide an item name or if the item doesn't exist
            const itemNames = Object.keys(itemsDatabase);

            if (itemNames.length === 0) {
                // No items in the database
                return interaction.reply({
                    content: "There are no items available in the database.",
                    ephemeral: true,
                });
            }

            const itemChunks = chunkArray(itemNames, 10); // Display 10 items per page
            let currentPage = 1;

            const embed = createListEmbed(currentPage, itemChunks[currentPage - 1]);

            const row = createNavigationRow(currentPage, itemChunks.length);

            const message = await interaction.reply({ embeds: [embed], components: [row] });

            if (!interaction.replied) {
                const filter = (i) => i.customId === 'previous' || i.customId === 'next';
                const collector = message.createMessageComponentCollector({ filter, time: 60000 });

                collector.on('collect', async (i) => {
                    if (i.customId === 'previous') {
                        currentPage -= 1;
                    } else if (i.customId === 'next') {
                        currentPage += 1;
                    }

                    const newEmbed = createListEmbed(currentPage, itemChunks[currentPage - 1]);
                    const newRow = createNavigationRow(currentPage, itemChunks.length);

                    await i.update({ embeds: [newEmbed], components: [newRow] });
                });

                collector.on('end', () => {
                    message.edit({ components: [] }).catch(console.error);
                });
            }
        } catch (error) {
            console.error(error);
            return interaction.reply({ content: 'An unexpected error occurred.', ephemeral: true });
        }
    },
};

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function createListEmbed(page, itemNames) {
    const itemsToShow = itemNames.join('\n');

    const embed = new MessageEmbed()
        .setColor('#3498db')
        .setTitle('List of items')
        .setDescription(itemsToShow);

    // Check if there's only one page and adjust the footer accordingly
    if (itemNames.length <= 10) {
        embed.setFooter({ text: 'Page 1/1' });
    } else {
        // Add 1 to the page number for correct page numbering
        embed.setFooter({ text: `Page ${page + 1}/${Math.ceil(itemNames.length / 10)}` });
    }

    return embed;
}

function createNavigationRow(currentPage, totalPages) {
    const row = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId('previous')
                .setLabel('Previous')
                .setStyle('PRIMARY')
                .setDisabled(currentPage === 1),
            new MessageButton()
                .setCustomId('next')
                .setLabel('Next')
                .setStyle('PRIMARY')
                .setDisabled(currentPage === totalPages),
        );

    return row;
}

function chunkArray(array, chunkSize) {
    const result = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        result.push(array.slice(i, i + chunkSize));
    }
    return result;
}
