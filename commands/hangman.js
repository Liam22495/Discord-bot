const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');

const words = ['Founder', 'discord', 'RVStudios', 'hangman', 'gaming','dog','flower','jazz','xylophone','rhombus','sasquatch','perpendicular','baccalaureate','antidisestablishmentarianism','hippopotomonstrosesquippedaliophobia'];
const maxAttempts = 10;

module.exports = {
    name: 'hangman',
    description: 'Starts a new hangman game',
    type: 1,
    async execute(interaction) {
        const word = words[Math.floor(Math.random() * words.length)];
        let attempts = maxAttempts;
        let guessed = Array(word.length).fill('-');
        let guessedLetters = [];

        const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
        const numRows = 5;
        const buttonsPerRow = 5;
        const rows = [];
        alphabet.length = 25;

        for (let i = 0; i < numRows; i++) {
            const row = new MessageActionRow();
            for (let j = i * buttonsPerRow; j < (i * buttonsPerRow) + buttonsPerRow && j < alphabet.length; j++) {
                const button = new MessageButton()
                    .setCustomId(`hangman_${alphabet[j]}`)
                    .setLabel(alphabet[j].toUpperCase())
                    .setStyle('PRIMARY');
                row.addComponents(button);
            }
            rows.push(row);
        }

        const filteredRows = rows.filter(row => row.components.length > 0);

        const embed = new MessageEmbed()
            .setTitle('Hangman Game')
            .setDescription(`Word: ${guessed.join(' ')}\nAttempts left: ${attempts}`)
            .setColor('BLUE');

        const gameMessage = await interaction.reply({ embeds: [embed], components: filteredRows, fetchReply: true });

        const collector = interaction.channel.createMessageComponentCollector({
            filter: i => i.customId.startsWith('hangman_') && i.user.id === interaction.user.id,
            time: 300000,
        });

        collector.on('collect', async i => {
            await i.deferUpdate();
            const letter = i.customId.split('_')[1];
            if (guessedLetters.includes(letter)) return;
            guessedLetters.push(letter);

            if (word.includes(letter)) {
                word.split('').forEach((char, index) => {
                    if (char === letter) guessed[index] = char;
                });
            } else {
                attempts--;
            }

            const updatedEmbed = new MessageEmbed()
                .setTitle('Hangman Game')
                .setDescription(`Word: ${guessed.join(' ')}\nAttempts left: ${attempts}\nGuessed letters: ${guessedLetters.join(', ').toUpperCase()}`)
                .setColor('BLUE');

            if (guessed.join('') === word) {
                collector.stop('won');
            } else if (attempts === 0) {
                collector.stop('lost');
            } else {
                await interaction.editReply({ embeds: [updatedEmbed] }); // Ensure that the message is being edited correctly
            }
        });

        collector.on('end', (collected, reason) => {
            const finalEmbed = new MessageEmbed()
                .setTitle('Hangman Game - Game Over')
                .setDescription(`The word was: **${word.toUpperCase()}**`)
                .setColor(reason === 'won' ? 'GREEN' : 'RED')
                .setFooter({text:reason === 'won' ? 'Congratulations! You won!' : 'Sorry, you lost!'});

            interaction.editReply({ embeds: [finalEmbed], components: [] });
        });
    },
};
