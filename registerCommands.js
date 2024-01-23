const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const fs = require('fs');

const { clientId, token, guildId } = require('./config.json');

const registerCommands = async () => {
    const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
    const commands = [];
  
    for (const file of commandFiles) {
        const command = require(`./commands/${file}`);
        commands.push(command);
    }
  
    const rest = new REST({ version: '10' }).setToken(token);
  
    try {
        console.log('Started refreshing application (/) commands for the specific guild.');
        await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands }
        );
        console.log('Successfully reloaded application (/) commands for the specific guild.');
    } catch (error) {
        console.error(error);
    }
  };
  
  module.exports = registerCommands; // Export the function
