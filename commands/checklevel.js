const { MessageEmbed } = require('discord.js');
const { db } = require('../database');
const { messageThresholds, maxLevel } = require('../utilities/levelingConstants');

const PROGRESS_BAR_LENGTH = 20;

function createProgressBar(value, maxValue) {
  if (value === "Maxed Level") {
    return '🟩'.repeat(PROGRESS_BAR_LENGTH);
  }

  const percentage = value / maxValue;
  const progress = Math.round(PROGRESS_BAR_LENGTH * percentage);

  const progressBar = '🟥'.repeat(Math.min(progress, PROGRESS_BAR_LENGTH))
    + '🟨'.repeat(Math.min(Math.max(progress - Math.round(0.33 * PROGRESS_BAR_LENGTH), 0), Math.round(0.33 * PROGRESS_BAR_LENGTH)))
    + '🟩'.repeat(Math.max(progress - Math.round(0.66 * PROGRESS_BAR_LENGTH), 0))
    + '⬛'.repeat(PROGRESS_BAR_LENGTH - progress);

  return progressBar;
}

const userCooldowns = new Map();

function handleCooldown(user) {
  if (userCooldowns.has(user.id)) {
    const cooldownData = userCooldowns.get(user.id);
    const currentTime = Date.now();

    if (currentTime < cooldownData.endTime) {
      const timeLeft = Math.ceil((cooldownData.endTime - currentTime) / 1000);
      let timeLeftMessage = '';

      if (timeLeft > 60) {
        const minutesLeft = Math.floor(timeLeft / 60);
        const secondsLeft = timeLeft % 60;
        timeLeftMessage = `${minutesLeft} minute(s) ${secondsLeft > 0 ? `and ${secondsLeft} second(s)` : ''} left.`;
      } else {
        timeLeftMessage = `${timeLeft} second(s) left.`;
      }

      return `Please wait! You can check your level again in ${timeLeftMessage}`;
    } else {
      userCooldowns.delete(user.id);
    }
  }

  const cooldownAmount = 1 * 60 * 1000;
  const endTime = Date.now() + cooldownAmount;
  userCooldowns.set(user.id, { startTime: Date.now(), endTime });
  return null;
}

module.exports = {
  name: 'checklevel',
  description: 'Check your level and message count.',
  async execute(interaction) {
    const cooldownMessage = handleCooldown(interaction.user);
    if (cooldownMessage) {
      return interaction.reply({ content: cooldownMessage, ephemeral: true });
    }

    const memberRole = interaction.guild.roles.cache.find(role => role.name === "Verified ✅");
    if (!interaction.member.roles.cache.has(memberRole.id)) {
      return interaction.reply({ content: 'You need the Verified role to use this command.', ephemeral: true });
    }

    const userId = interaction.user.id;
    const avatarURL = interaction.user.displayAvatarURL({ dynamic: true });

    // Fetch the user's leveling information from Firestore
    const userRef = db.collection('levels').doc(userId);
    const doc = await userRef.get();

    const embed = new MessageEmbed()
      .setTitle('Leveling Information')
      .setColor('BLURPLE')
      .setThumbnail(avatarURL)
      .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: avatarURL })
      .setTimestamp();

    if (doc.exists) {
      const userData = doc.data();
      const nextLevelMessages = userData.level === maxLevel ? "Maxed Level" : messageThresholds[userData.level + 1];
      const progressBar = createProgressBar(userData.level === maxLevel ? "Maxed Level" : userData.messages, nextLevelMessages);

      embed.addFields(
        { name: 'Current Level', value: userData.level.toString(), inline: true },
        { name: 'Messages Sent', value: userData.level === maxLevel ? "Maxed Level" : userData.messages.toString(), inline: true },
        { name: 'Next Level Requirement', value: nextLevelMessages.toString(), inline: false },
        { name: 'Progress', value: progressBar, inline: false }
      );
    } else {
      embed.setDescription('You have not started leveling yet. Send some messages to start!');
    }

    interaction.reply({ embeds: [embed] });
  },
};
