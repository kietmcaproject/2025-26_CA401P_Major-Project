const { PRIORITY_LEVEL } = require("./constants");

function baseScoreForLevel(level) {
  switch (level) {
    case PRIORITY_LEVEL.EMERGENCY:
      return 1000;
    case PRIORITY_LEVEL.VIP:
      return 300;
    case PRIORITY_LEVEL.SENIOR:
      return 200;
    case PRIORITY_LEVEL.PREGNANT:
      return 150;
    case PRIORITY_LEVEL.NORMAL:
    default:
      return 0;
  }
}

function computePriorityScore({ priorityLevel, triageScore }) {
  const base = baseScoreForLevel(priorityLevel);
  const triage = typeof triageScore === "number" ? triageScore : 0;
  return base + triage;
}

module.exports = { computePriorityScore, baseScoreForLevel };
