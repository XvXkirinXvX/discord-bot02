const bannedPatterns = [
  /rinki/,
  /gay/,
  /hao/,
  /kuman/,
  /homo/,
  /lesbian/,
  /lesbi/,
  /yuri/,
  /bodoh/,
  /goblok/,
  /fuck/,
  /asw/,
  /asu/,
  /inkir/,
  /kirin/,
  /loli/,
  /lonte/,
  /lont*/,
  /fck/,
  /discord\.gg/i,
  /https?:\/\//i
];

function containsBanned(text) {
  return bannedPatterns.some(p => p.test(text));
}

module.exports = { containsBanned };
