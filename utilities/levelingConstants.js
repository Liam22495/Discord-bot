const messageThresholds = {
  1: 25,
  2: 50,
  3: 75,
  4: 100,
  5: 125,
  6: 145,
  7: 175,
  8: 200,
  9: 245,
  10: 300,
  11: 325,
  12: 345,
  13: 375,
  14: 400,
  15: 500
};

const maxLevel = Math.max(...Object.keys(messageThresholds).map(Number));

module.exports = {
  messageThresholds,
  maxLevel
};
