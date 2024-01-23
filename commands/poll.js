const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'poll',
    description: 'Create a poll',
    options: [
        {
            name: 'title',
            type: 3,
            description: 'Title of the poll',
            required: true,
        },
        {
            name: 'timer',
            type: 4,
            description: 'write a number (you will select the s,m,h,d in timeunit',
            required: true,
        },
        {
            name: 'time_unit',
            type: 3, // STRING type
            description: 'Unit of time for the timer (s, m, h, d)',
            required: true,
        },
        {
            name: 'option1',
            type: 3,
            description: 'If only one option write the poll in the title',
            required: true,
        },
        {
            name: 'option2',
            type: 3,
            description: '2nd option',
            required: true,
        },
        {
            name: 'option3',
            type: 3,
            description: '3rd option',
            required: false,
        },
        {
            name: 'option4',
            type: 3,
            description: '4th option',
            required: false,
        },
    ],
    async execute(interaction) {
        if (!interaction.member.roles.cache.has('1149335013993762908')) {
            return interaction.reply({ content: 'You do not have the required role to use this command!', ephemeral: true });
        }

        const title = interaction.options.getString('title');
        const timer = interaction.options.getInteger('timer');
        const timeUnit = interaction.options.getString('time_unit');
        let multiplier;

        switch (timeUnit.toLowerCase()) {
            case 's': // seconds
                multiplier = 1000;
                break;
            case 'm': // minutes
                multiplier = 60 * 1000;
                break;
            case 'h': // hours
                multiplier = 60 * 60 * 1000;
                break;
            case 'd': // days
                multiplier = 24 * 60 * 60 * 1000;
                break;
            default:
                return interaction.reply({ content: 'Invalid time unit! Use s for seconds, m for minutes, h for hours, and d for days.', ephemeral: true });
        }
        const endTime = Date.now() + timer * multiplier;
        const options = [
            interaction.options.getString('option1'),
            interaction.options.getString('option2'),
            interaction.options.getString('option3'),
            interaction.options.getString('option4'),
        ].filter(Boolean);

        if (options.length < 2) {
            return interaction.reply({ content: 'Please provide at least two options for the poll.', ephemeral: true });
        }

        const pollEmbed = new MessageEmbed()
            .setTitle(title)
            .setFooter({ text: 'Poll ends at' })
            .setTimestamp(endTime);

        const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣'];
        pollEmbed.addFields(options.map((option, index) => ({ name: `${index + 1}. ${option}`, value: '▬▬▬▬▬▬▬▬▬▬▬▬ 0%' })));

        const sentEmbed = await interaction.channel.send({ content: '@everyone', embeds: [pollEmbed] });
        emojis.slice(0, options.length).forEach(emoji => sentEmbed.react(emoji));

        const filter = (reaction, user) => emojis.includes(reaction.emoji.name) && !user.bot;
        const collector = sentEmbed.createReactionCollector({ filter, time: timer * multiplier });

        collector.on('collect', async (reaction, user) => {
            // Remove other reactions from the user
            const userReactions = sentEmbed.reactions.cache.filter(reaction => reaction.users.cache.has(user.id));
            for (const userReaction of userReactions.values()) {
                if (userReaction.emoji.name !== reaction.emoji.name) {
                    await userReaction.users.remove(user.id);
                }
            }
            // Update the poll
            await updatePoll(sentEmbed, emojis, options.length);
        });

        interaction.client.on('messageReactionRemove', async (reaction, user) => {
            if (reaction.message.id === sentEmbed.id && emojis.includes(reaction.emoji.name)) {
                console.log(`Reaction removed: ${reaction.emoji.name} by ${user.id}`);
                // Refetch the message to get the updated reactions
                const fetchedMessage = await interaction.channel.messages.fetch(sentEmbed.id);
                // Update the poll with the refetched message
                await updatePoll(fetchedMessage, emojis, options.length);
            }
        });

        collector.on('end', async () => {
            const endedEmbed = new MessageEmbed()
                .setTitle(`${title} - Ended`)
                .setFooter({ text: `Poll ended` })
                .setTimestamp(Date.now());

            // Calculate the winner(s)
            const reactionCounts = sentEmbed.reactions.cache.map(reaction => ({
                emoji: reaction.emoji.name,
                count: reaction.count - 1 // Subtract one to exclude the bot's reaction
            }));


            const maxVotes = Math.max(...reactionCounts.map(r => r.count));
            const winners = reactionCounts.filter(reaction => reaction.count === maxVotes);

            // If there is a tie
            if (winners.length > 1) {
                const winningOptions = winners.map(w => `${emojis.indexOf(w.emoji) + 1}. ${options[emojis.indexOf(w.emoji)]}`).join(', ');
                endedEmbed.addFields({ name: 'Result:', value: `It's a tie: ${winningOptions}` });
            } else if (winners.length === 1) {
                const winningOption = `${emojis.indexOf(winners[0].emoji) + 1}. ${options[emojis.indexOf(winners[0].emoji)]}`;
                endedEmbed.addFields({ name: 'Winner:', value: winningOption });
            } else {
                endedEmbed.addFields({ name: 'Result:', value: 'No votes received!' });
            }

            await sentEmbed.edit({ embeds: [endedEmbed] });
        });
    },
};

async function updatePoll(message, emojis, optionLength) {
    const reactions = message.reactions.cache.filter(reaction => emojis.includes(reaction.emoji.name));
    const totalVotes = reactions.reduce((acc, reaction) => acc + reaction.count - 1, 0); // Subtract bots

    const newEmbed = new MessageEmbed(message.embeds[0]);

    reactions.forEach((reaction) => {
        const emojiIndex = emojis.indexOf(reaction.emoji.name);
        if (emojiIndex >= optionLength) return;

        const percentage = totalVotes === 0 ? 0 : Math.round((reaction.count - 1) / totalVotes * 100);
        const bar = '▬'.repeat(Math.round(percentage / 10)) + '▭'.repeat(10 - Math.round(percentage / 10));
        newEmbed.fields[emojiIndex].value = `${bar} ${percentage}%`;
    });

    await message.edit({ embeds: [newEmbed] });
}
