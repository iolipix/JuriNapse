// Deprecated no-op service (collection supprimée). Gardé pour compat rétro.
async function fetchProfilePictures() { return {}; }
async function hydrateUsersWithProfilePictures(users) { return users; }
module.exports = { fetchProfilePictures, hydrateUsersWithProfilePictures };
