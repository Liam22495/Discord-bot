const { MessageEmbed } = require("discord.js");

const challenges = {
  physical: [
    "Do 20 push-ups.",
    "Run or walk for 1 hour.",
    "Complete 10 burpees.",
    "Stretch for 5 minutes.",
    "Plank for 1 minute.",
    "10 situps for 3 sets",
    "7 pullups for 3 sets",
    "10 reps of 20kg dumbells for 3 sets",
    "30 jumping jacks",
    "15 pushups for 3 sets",
    "15 lunges per leg.",
    "Complete 20 squats.",
    "5 minutes of yoga.",
    "Jump rope for 10 minutes.",
    "30-minute bike ride.",
    "Wall sit for 2 minutes.",
    "10 calf raises for 3 sets.",
    "5 reps of deadlifts with a weight of your choice.",
    "10 mountain climbers for 3 sets.",
    "Do a 5-minute meditation after your workout.",
    "Perform 5 minutes of shadow boxing.",
    "Try 10 leg raises for 3 sets.",
    "15 reps of 15kg kettlebell swings.",
    "10 reps of barbell bench press with appropriate weight.",
    "8 reps of weighted lunges with 10kg dumbbells in each hand.",
    "10 reps of shoulder press using dumbbells for 3 sets.",
    "15 reps of bicep curls with a weight that's challenging.",
    "10 tricep dips on a sturdy chair or bench.",
    "10 reps of bent-over rows using a barbell or dumbbells.",
    "Complete 3 sets of leg press with a challenging weight.",
    "12 reps of weighted step-ups holding 5kg dumbbells.",
    "8 reps of front and side lateral raises using dumbbells.",
    "Complete 10 reps of hammer curls with dumbbells.",
    "Finish 3 sets of weighted Russian twists for core strength.",
    "Perform 10 goblet squats holding a kettlebell or dumbbell.",
    "3 sets of chest flies using dumbbells on a bench.",

    // ... add more physical challenges
  ],
  eating: [
    "Eat a fruit you haven't tried before.",
    "Drink 2 liters of water today.",
    "Cook a new recipe.",
    "Try a vegetarian meal.",
    "Avoid sugary drinks for a day.",
    "Consume a high protein meal.",
    "Cut down caffeine for a day.",
    "Have a balanced meal with carbs, proteins, and fats.",
    "Go a day without processed foods.",
    "Eat 5 different colored vegetables today.",
    "Have a breakfast smoothie with at least 3 fruits.",
    "Replace dessert with a healthy snack.",
    "Try a new type of tea or herbal infusion.",
    "Make your own homemade salad dressing.",
    "Opt for whole grains over refined grains.",
    "Introduce a new leafy green to your meal.",
    "Experiment with a plant-based protein source like tofu or tempeh.",
    "Avoid fried foods for the day.",
    "Hydrate with coconut water after a workout.",
    "Prepare a dish using a new herb or spice.",
    "Go for a sugar-free day.",
    "Challenge yourself to consume 30g of fiber.",
    "Replace a meaty meal with a seafood option.",
    "Try a dairy-free alternative like almond or oat milk.",
    "Start your day with a glass of lemon water.",

    // ... add more eating challenges
  ],
  gaming: [
    "Win a match.",
    "Obtain 15 kills in a game.",
    "Achieve a personal best in a game of your choice.",
    "Complete 5 in-game quests or challenges.",
    "Obtain 2000 or more of any sort of in-game money.",
    "Spend an hour on a puzzle game.",
    "Reach a new level or rank in your favorite game.",
    "Complete a game by completing a full quest",
    "Participate in a gaming tournament or competition.",
    "Play a game from your backlog that you haven't started.",
    "Unlock a difficult achievement or trophy.",
    "Customize or upgrade your in-game character's appearance or gear.",
    "Write a game review or recommendation for a community forum.",
    "Solve a complex puzzle or riddle in an adventure game.",
    "Interact with 10 different in-game NPCs.",
    "Discover a hidden Easter egg or secret in a game.",
    "Play and win a strategy or simulation game.",
    "Set up and manage an in-game guild or team.",
    "Try a game based on a movie or TV series.",
    "Play a game without using any in-game purchases.",
    "Complete a game without using any cheats or hints.",
    "Explore an open-world game's map fully.",
    "Learn and master a new in-game skill or ability.",

    // ... add more gaming challenges
  ],
};

module.exports = {
  name: "dailychallenge",
  description: "Get a set of daily challenges based on category.",
  options: [
    {
      name: "category",
      description: "Type of challenge",
      type: 3, // String
      required: true,
      choices: [
        { name: "Physical", value: "physical" },
        { name: "Eating", value: "eating" },
        { name: "Gaming", value: "gaming" },
      ],
    },
    {
      name: "number",
      description: "Number of challenges you want.",
      type: 4, // Integer
      required: true,
    },
  ],
  async execute(interaction) {
    const category = interaction.options.getString("category");
    const numChallenges = interaction.options.getInteger("number");

    const categoryChallenges = challenges[category];
    if (!categoryChallenges) {
      return interaction.reply("Invalid category provided.");
    }

    if (numChallenges <= 0 || numChallenges > categoryChallenges.length) {
      return interaction.reply(
        `Please select a number between 1 and ${categoryChallenges.length}.`
      );
    }

    const selectedChallenges = [];
    while (selectedChallenges.length < numChallenges) {
      const challengeIndex = Math.floor(
        Math.random() * categoryChallenges.length
      );
      const challenge = categoryChallenges[challengeIndex];

      // Ensure unique challenges
      if (!selectedChallenges.includes(challenge)) {
        selectedChallenges.push(challenge);
      }
    }

    const embed = new MessageEmbed()
      .setTitle("Daily Challenges!")
      .setDescription(selectedChallenges.join("\n\n"))
      .setColor("BLUE")
      .setTimestamp();

    interaction.reply({ embeds: [embed] });
  },
};