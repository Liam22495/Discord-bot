const { db } = require("../database");
const { messageThresholds, maxLevel } = require("./levelingConstants");
const { MessageEmbed } = require("discord.js");

async function incrementUserMessages(userId, guild) {
  if (!guild) return;
  const userRef = db.collection("levels").doc(userId);

  try {
    const doc = await userRef.get();
    if (doc.exists) {
      const data = doc.data();
      if (data.level < maxLevel) {
        let newMessages = data.messages + 1;
        let newLevel = data.level;

        if (newMessages >= messageThresholds[newLevel + 1]) {
          newLevel += 1;
          newMessages = 0;

          const member = guild.members.cache.get(userId);
          if (member) {
            // Add new role
            const newRole = guild.roles.cache.find(
              (role) => role.name === `Level ${newLevel}`
            );
            if (newRole) member.roles.add(newRole);

            // Remove old role
            const oldRole = guild.roles.cache.find(
              (role) => role.name === `Level ${newLevel - 1}`
            );
            if (oldRole) member.roles.remove(oldRole);

            // Remove Level 0 role if they surpass Level 0
            if (newLevel > 0) {
              const level0Role = guild.roles.cache.find(
                (role) => role.name === "Level 0"
              );
              if (level0Role && member.roles.cache.has(level0Role.id)) {
                member.roles.remove(level0Role).catch(console.error);
              }
            }

            const channel = guild.channels.cache.get("1148334688306483331");
            if (channel) {
              const embed = new MessageEmbed()
                .setTitle("🎉 Level Up! 🎉")
                .setDescription(`${member} has reached **Level ${newLevel}**!`)
                .setColor("#4caf50")
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: "Keep up the great work!" })
                .setTimestamp();

              channel.send({ embeds: [embed] });
            }
          }
        }

        await userRef.update({ level: newLevel, messages: newMessages });
      }
    } else {
      await userRef.set({ user_id: userId, level: 0, messages: 1 });
    }
  } catch (err) {
    console.error(err);
  }
}

async function initializeMemberRoles(guild) {
  const memberRole = guild.roles.cache.find((role) => role.name === "Member");
  const level0Role = guild.roles.cache.find((role) => role.name === "Level 0");

  if (!memberRole || !level0Role) return; // Ensure roles exist

  try {
    const members = await guild.members.fetch();
    members.each((member) => {
      if (
        member.roles.cache.has(memberRole.id) &&
        !member.roles.cache.has(level0Role.id)
      ) {
        member.roles.add(level0Role);
      }
    });
  } catch (err) {
    console.error(err);
  }
}

module.exports = {
  incrementUserMessages,
  initializeMemberRoles,
};
