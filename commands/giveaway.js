const { MessageEmbed } = require('discord.js');

const DURATION_MULTIPLIERS = {
    seconds: 1000,
    minutes: 60 * 1000,
    hours: 60 * 60 * 1000,
    days: 24 * 60 * 60 * 1000,
    weeks: 7 * 24 * 60 * 60 * 1000,
    months: 30 * 24 * 60 * 60 * 1000,
};

let pastWinners = new Set(); // To store past selected winners
let endedGiveaways = new Set();

async function selectWinner(giveawayMessage, targetChannel, embed, item, interaction) {
    const usersReacted = (await giveawayMessage.reactions.cache.get('🎉').users.fetch()).filter(u => !u.bot && !pastWinners.has(u.id));
    if (usersReacted.size === 0) {
        pastWinners.clear(); // Clear past winners for future giveaways
        return targetChannel.send('No one claimed this giveaway 😢💔');
    }

    const winner = usersReacted.random();
    pastWinners.add(winner.id); // Add winner to past winners

    embed.fields[1].name = "WINNER";

    embed.fields[1].value = winner.toString();
    await giveawayMessage.edit({ embeds: [embed] });

    const winnerMessage = await targetChannel.send(`🎉 **CONGRATULATIONS** 🎉\n ${winner}, react with ✅ below to claim **${item}**!`);
    await winnerMessage.react('✅');

    const filter = (reaction, user) => reaction.emoji.name === '✅';

    const collector = winnerMessage.createReactionCollector({ filter, time: 10000 });  // 10 seconds

    collector.on('collect', (reaction, user) => {
        if (user.id !== winner.id) {
            user.send("You have not won this giveaway.").catch(console.error);
            reaction.users.remove(user);
        } else {
            pastWinners.clear(); // Clear past winners as prize was claimed
            collector.stop('claimed');
        }
    });

    collector.on('end', (collected, reason) => {
        if (reason === 'time') {
            selectWinner(giveawayMessage, targetChannel, embed, item);
        } else if (reason === 'claimed') {
            const hostName = interaction.options.getString('host');  // Retrieve host's name
            targetChannel.send(`${winner} Have claimed their prize! Contact ${hostName} in order to receive it.`);
        }
    });
}

module.exports = {
    name: 'giveaway',
    description: 'start a new giveaway',
    type: 1,
    options: [
        {
            name: 'item',
            type: 3,
            description: 'The item you want to giveaway',
            required: true,
        },
        {
            name: 'duration',
            type: 10,
            description: 'The numeric duration of the giveaway',
            required: true,
        },
        {
            name: 'duration_type',
            type: 3,
            description: 'The unit of the duration (seconds, minutes, hours, days, weeks, months)',
            required: true,
            choices: [
                { name: 'seconds', value: 'seconds' },
                { name: 'minutes', value: 'minutes' },
                { name: 'hours', value: 'hours' },
                { name: 'days', value: 'days' },
                { name: 'weeks', value: 'weeks' },
                { name: 'months', value: 'months' },
            ],
        },
        {
            name: 'host',
            type: 3,
            description: 'Name of the host of the giveaway',
            required: true,
        },
    ],

    async execute(interaction) {
        const requiredRoleID = '1149335013993762908';
        if (!interaction.member.roles.cache.has(requiredRoleID)) {
            return interaction.reply({ content: "You don't have the required role to use this command.", ephemeral: true });
        }

        const item = interaction.options.getString('item');
        const duration = interaction.options.getNumber('duration');
        const durationType = interaction.options.getString('duration_type');
        const hostName = interaction.options.getString('host');

        const durationInMilliseconds = duration * DURATION_MULTIPLIERS[durationType] || 0;
        const endTimestamp = Math.floor((Date.now() + durationInMilliseconds) / 1000);

        const embed = new MessageEmbed()
            .setTitle('🎉 **GIVEAWAY** 🎉')
            .setDescription(`We're giving away **${item}**! React with 🎉 to enter!`)
            .addFields(
                { name: 'HOST', value: hostName },
                { name: 'Duration', value: `<t:${endTimestamp}:R>` }
            )
            .setColor('BLUE')
            .setImage('https://media.istockphoto.com/id/1183256238/vector/giveaway-banner-for-social-media-contests-and-special-offer-vector-stock-illustration.jpg?s=612x612&w=0&k=20&c=1vWvnJaTodnPnNkSd_6Qii2AS3KCUKSrDc01GwSQS8g=');

        const targetChannelID = '1148613512223002786';
        const targetChannel = interaction.guild.channels.cache.get(targetChannelID);

        const giveawayMessage = await targetChannel.send({ content: '<@&1150470180858761318>', embeds: [embed] });
        await giveawayMessage.react('🎉');

        const reactionFilter = (reaction, user) => {
            return reaction.emoji.name === '🎉' && !user.bot;
        };

        const reactionCollector = giveawayMessage.createReactionCollector({ filter: reactionFilter, dispose: true });

        reactionCollector.on('collect', (reaction, user) => {
            if (endedGiveaways.has(giveawayMessage.id)) {
                user.send("The giveaway has already ended.").catch(console.error);
                reaction.users.remove(user).catch(console.error);
            }
        });

        setTimeout(() => {
            selectWinner(giveawayMessage, targetChannel, embed, item, interaction);
            reactionCollector.stop();
            endedGiveaways.add(giveawayMessage.id);
        }, durationInMilliseconds);


        await interaction.reply({ content: 'Giveaway started!', ephemeral: true });
    },
};