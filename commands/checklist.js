const { db } = require("../database");
const { MessageEmbed } = require("discord.js");

function hasRequiredRole(member) {
  //Roles that can use this command
  const requiredRoleId = "1149335013993762908";

  return member.roles.cache.has(requiredRoleId);
}

function createEmbed(title, color, fields) {
  const embed = new MessageEmbed().setTitle(title).setColor(color);

  if (fields) {
    for (const field of fields) {
      embed.addFields({ name: field.name, value: field.value });
    }
  }

  return embed;
}

module.exports = {
  name: "checklist",
  description: "Manage a personalized checklist",
  options: [
    {
      name: "action",
      type: 3,
      description: "Action to perform (add, view, delete, update(Label))",
      required: true,
      choices: [
        { name: "Add", value: "add" },
        { name: "View", value: "view" },
        { name: "Delete", value: "delete" },
        { name: "Update", value: "update" },
      ],
    },
    {
      name: "category",
      type: 3,
      description:
        "Category of the item (Required for add and delete, optional for view)",
      required: false,
    },
    {
      name: "item",
      type: 3,
      description: "Item to manage (Required for add, optional for delete)",
      required: false,
    },

    {
      name: "label",
      type: 3,
      description: "Label for the item",
      required: false,
      choices: [
        { name: "Not Started", value: "not-started" },
        { name: "In Progress", value: "in-progress" },
        { name: "Completed", value: "completed" },
      ],
    },
  ],

  async execute(interaction) {
    // Check if the user has the required role
    if (!hasRequiredRole(interaction.member)) {
      interaction.reply("You do not have permission to use this command.");
      return;
    }

    const action = interaction.options.getString("action");
    const category = interaction.options.getString("category");
    const item = interaction.options.getString("item");
    const label = interaction.options.getString("label");
    const userId = interaction.user.id; // Get the user's ID

    switch (action) {
      case "add":
        try {
          if (!category || !item) {
            const errorEmbed = createEmbed("Error", "#FF0000", [
              {
                name: "Error",
                value: "Category and item fields must not be left empty.",
              },
            ]);
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
          }

          let categoryRef = db.collection("checklist_categories").doc(category);
          let categoryDoc = await categoryRef.get();

          if (!categoryDoc.exists) {
            // If it doesn't exist, create the category
            await categoryRef.set({ title: category });
          }

          let itemRef = categoryRef.collection("items").doc();
          await itemRef.set({
            item: item,
            label: label || "not-started",
            user_id: userId,
          });

          const successEmbed = createEmbed("Success", "#00FF00", [
            {
              name: "Item Added",
              value: `Item "${item}" added to category "${category}" with label "${
                label || "not-started"
              }" successfully!`,
            },
          ]);

          interaction.reply({ embeds: [successEmbed], ephemeral: true });
        } catch (error) {
          const errorEmbed = createEmbed("Error", "#FF0000", [
            { name: "Error", value: "Error adding item to checklist." },
          ]);
          console.error("Error while adding an item:", error);
          interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
        break;

      case "view":
        try {
          if (category) {
            // Viewing items from a specific category
            let categoryRef = db
              .collection("checklist_categories")
              .doc(category);
            let categoryDoc = await categoryRef.get();

            if (!categoryDoc.exists) {
              const errorEmbed = createEmbed("Error", "#FF0000", [
                { name: "Error", value: `Category "${category}" not found.` },
              ]);
              return interaction.reply({
                embeds: [errorEmbed],
                ephemeral: true,
              });
            }

            let itemsSnapshot = await categoryRef
              .collection("items")
              .where("user_id", "==", userId)
              .get();

            if (itemsSnapshot.empty) {
              const errorEmbed = createEmbed("Error", "#FF0000", [
                {
                  name: "Error",
                  value: `No items found in category "${category}".`,
                },
              ]);
              return interaction.reply({
                embeds: [errorEmbed],
                ephemeral: true,
              });
            }

            const itemList = itemsSnapshot.docs.map((doc) => {
              let itemData = doc.data();
              return {
                name: itemData.item,
                value: `${itemData.item} - ${
                  itemData.label === "not-started"
                    ? "Not Started❗"
                    : itemData.label === "in-progress"
                    ? "In Progress 🚧"
                    : "Completed ✅"
                }`,
              };
            });

            const checklistEmbed = createEmbed(
              `${category} Checklist`,
              "#3498DB",
              itemList
            );

            interaction.reply({ embeds: [checklistEmbed] });
          } else {
            // Viewing all categories and their items for the user
            let categoriesSnapshot = await db
              .collection("checklist_categories")
              .get();
            let response = "";

            for (let categoryDoc of categoriesSnapshot.docs) {
              const categoryData = categoryDoc.data();
              let itemsSnapshot = await categoryDoc.ref
                .collection("items")
                .where("user_id", "==", userId)
                .get();

              if (!itemsSnapshot.empty) {
                response += `**${categoryData.title}**:\n`;
                itemsSnapshot.forEach((doc) => {
                  let itemData = doc.data();
                  response += `- ${itemData.item} - ${
                    itemData.label === "not-started"
                      ? "Not Started❗"
                      : itemData.label === "in-progress"
                      ? "In Progress 🚧"
                      : "Completed ✅"
                  }\n`;
                });
                response += "\n";
              }
            }

            if (!response) {
              const errorEmbed = createEmbed("Error", "#FF0000", [
                { name: "Error", value: "No items found in the checklist." },
              ]);

              return interaction.reply({
                embeds: [errorEmbed],
                ephemeral: true,
              });
            }

            const checklistEmbed = createEmbed("Checklist", "#3498DB", [
              { name: " ", value: response.trim() },
            ]);

            interaction.reply({ embeds: [checklistEmbed] });
          }
        } catch (error) {
          const errorEmbed = createEmbed("Error", "#FF0000", [
            { name: "Error", value: "Error fetching checklist." },
          ]);
          console.error("Error while viewing items:", error);
          interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
        break;

      case "delete":
        try {
          if (!category) {
            return interaction.reply("Please specify a category to delete.", {
              ephemeral: true,
            });
          }

          // Reference to the category document
          let categoryRef = db.collection("checklist_categories").doc(category);
          let categoryDoc = await categoryRef.get();

          if (!categoryDoc.exists) {
            return interaction.reply(`Category "${category}" not found.`, {
              ephemeral: true,
            });
          }

          if (item) {
            // Delete a specific item from the category for the user
            let itemQuerySnapshot = await categoryRef
              .collection("items")
              .where("user_id", "==", userId)
              .where("item", "==", item)
              .get();

            // Use a batch to perform deletion of items
            let batch = db.batch();
            itemQuerySnapshot.forEach((doc) => {
              batch.delete(doc.ref);
            });
            await batch.commit();

            interaction.reply(
              `Item "${item}" has been deleted from category "${category}".`
            );
          } else {
            // Delete the entire category and all items within it
            // First, delete all items within the category
            let itemQuerySnapshot = await categoryRef.collection("items").get();

            // Use a batch to perform deletion of items
            let batch = db.batch();
            itemQuerySnapshot.forEach((doc) => {
              batch.delete(doc.ref);
            });

            // Delete the category itself
            batch.delete(categoryRef);

            // Commit the batch operation
            await batch.commit();

            interaction.reply(
              `Category "${category}" and all its items have been deleted.`
            );
          }
        } catch (error) {
          console.error("Error while deleting:", error);
          interaction.reply("Error performing deletion.", { ephemeral: true });
        }
        break;

      case "update":
        try {
          if (!category || !item || !label) {
            return interaction.reply(
              "Please provide category, item, and label for the update.",
              { ephemeral: true }
            );
          }

          let categoryRef = db.collection("checklist_categories").doc(category);
          let categoryDoc = await categoryRef.get();

          if (!categoryDoc.exists) {
            return interaction.reply(`Category "${category}" not found.`, {
              ephemeral: true,
            });
          }

          // Update the label for the specified item for the user
          let itemQuerySnapshot = await categoryRef
            .collection("items")
            .where("user_id", "==", userId)
            .where("item", "==", item)
            .get();
          itemQuerySnapshot.forEach(async (doc) => {
            await doc.ref.update({ label: label });
          });
          interaction.reply(
            `Label for item "${item}" in category "${category}" updated to "${label}" successfully.`
          );
        } catch (error) {
          console.error("Error while updating item:", error);
          interaction.reply("Error updating item label.", { ephemeral: true });
        }
        break;

      default:
        interaction.reply("Invalid action for checklist.", { ephemeral: true });
        break;
    }
  },
};
