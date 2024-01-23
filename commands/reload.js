const fs = require('fs');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const { clientId, token, guildId } = require('../config.json');

module.exports = {
    name: 'reload',
    description: 'Reload all commands',
    async execute(interaction) {
        // Check if the user is the specific user allowed to use this command
        const allowedUserId = '249204177748754432';
        if (interaction.user.id !== allowedUserId) {
            return interaction.reply({ content: 'You do not have permission to use this command!', ephemeral: true });
        }

        // Reload commands logic
        const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
        const commands = [];

        // Loop through each command file and push its data into the commands array
        for (const file of commandFiles) {
            try {
                delete require.cache[require.resolve(`./${file}`)]; // Remove cached version of the command
                const command = require(`./${file}`);
                if (command.name) {
                    commands.push(command);
                } else {
                    console.error(`Command in ${file} is missing 'name' property.`);
                }
            } catch (error) {
                console.error(`There was an error loading the command from ${file}:`, error);
            }
        }

        // Debugging: Log the commands before registering
        //console.log(commands);

        const rest = new REST({ version: '10' }).setToken(token);
        try {
            await rest.put(
                Routes.applicationGuildCommands(clientId, guildId),
                { body: commands }
            );
            await interaction.reply('Commands reloaded!');
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Failed to reload commands. Check console for error.', ephemeral: true });
        }
    }
};
