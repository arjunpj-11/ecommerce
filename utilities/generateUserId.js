const User = require("../models/user");

/**
 * Utility function to generate a unique 6-digit userId format Arni/XXXXXX
 */
async function generateUniqueUserId() {
  let uniqueId;
  let isUnique = false;

  while (!isUnique) {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    uniqueId = `Arni/${randomNum}`;

    const existingUser = await User.findOne({ userId: uniqueId });
    if (!existingUser) {
      isUnique = true;
    }
  }

  return uniqueId;
}

module.exports = generateUniqueUserId;
