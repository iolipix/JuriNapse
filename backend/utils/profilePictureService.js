const ProfilePicture = require('../models/profilePicture.model');

/**
 * Fetch a map userId -> imageData for given userIds (only for those missing in cache argument)
 */
async function fetchProfilePictures(userIds) {
  if (!userIds || userIds.length === 0) return {};
  const docs = await ProfilePicture.find({ userId: { $in: userIds } }).select('userId imageData').lean();
  const map = {};
  for (const d of docs) {
    if (d.imageData && d.imageData.length < 5_000_000) {
      map[d.userId.toString()] = d.imageData;
    }
  }
  return map;
}

/**
 * Ensure an array of lightweight user objects each has a profilePicture (prefer existing field, else collection).
 */
async function hydrateUsersWithProfilePictures(users) {
  if (!Array.isArray(users) || users.length === 0) return users;
  const missingIds = users
    .filter(u => !(u.profilePicture && u.profilePicture.length > 0))
    .map(u => (u._id || u.id)?.toString())
    .filter(Boolean);
  if (missingIds.length === 0) return users;
  const map = await fetchProfilePictures(missingIds);
  users.forEach(u => {
    const id = (u._id || u.id)?.toString();
    if (id && !u.profilePicture && map[id]) {
      u.profilePicture = map[id];
    }
  });
  return users;
}

module.exports = { fetchProfilePictures, hydrateUsersWithProfilePictures };
