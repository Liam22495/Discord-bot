module.exports = (client) => {
  const rolesByReaction = {
    '📣': 'Announcements 📣',
    '👀': 'Simulator Leaks 👀',
    '❣️': 'Simulator Updates ❣️',
    '💝': 'Giveaways 💝',
    '✅': 'Verified ✅',  // Added the mapping for the checkmark to the Verified role
  };

  const reactionChannelId = '1148868504230035576';
  const rulesChannelId = '1150703132444217354';  // New channel ID

  client.on('messageReactionAdd', async (reaction, user) => {
    if (reaction.partial) {   // Handling partial reactions
      try {
        await reaction.fetch();
      } catch (error) {
        console.error('Fetching message failed: ', error);
        return;
      }
    }

    if (user.bot) return;
    if (reaction.message.channelId !== reactionChannelId && reaction.message.channelId !== rulesChannelId) {  // Adjusted to check for either channel
      console.log("Reaction added in a different channel");
      return;
    }

    const reactedRole = rolesByReaction[reaction.emoji.name];
    if (!reactedRole) {
      console.log("Reacted with an emoji not in the rolesByReaction mapping");
      return;
    }

    const guild = reaction.message.guild;
    const role = guild.roles.cache.find((role) => role.name === reactedRole);
    if (!role) {
      console.log(`Role ${reactedRole} not found in guild.`);
      return;
    }

    const member = await guild.members.fetch(user);
    if (member.roles.cache.has(role.id)) {
      console.log("Member already has the role");
      return;
    }

    member.roles.add(role);
    console.log(`Added role ${role.name} to ${user.username}`);
  });

  client.on('messageReactionRemove', async (reaction, user) => {
    if (reaction.partial) {  // Handling partial reactions
      try {
        await reaction.fetch();
      } catch (error) {
        console.error('Fetching message failed: ', error);
        return;
      }
    }

    if (user.bot) return;
    if (reaction.message.channelId !== reactionChannelId && reaction.message.channelId !== rulesChannelId) {  // Adjusted to check for either channel
      console.log("Reaction removed from a different channel");
      return;
    }

    const reactedRole = rolesByReaction[reaction.emoji.name];
    if (!reactedRole) {
      console.log("Reacted with an emoji not in the rolesByReaction mapping");
      return;
    }

    const guild = reaction.message.guild;
    const role = guild.roles.cache.find((role) => role.name === reactedRole);
    if (!role) {
      console.log(`Role ${reactedRole} not found in guild.`);
      return;
    }

    const member = await guild.members.fetch(user);
    if (!member.roles.cache.has(role.id)) {
      console.log("Member doesn't have the role");
      return;
    }

    member.roles.remove(role);
    console.log(`Removed role ${role.name} from ${user.username}`);
  });
};
