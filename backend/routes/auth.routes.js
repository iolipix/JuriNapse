const express = require('express');
const router = express.Router();

// Import des controllers et middleware
const { 
  register, 
  login, 
  logout,
  getProfile, 
  updateProfile, 
  uploadProfilePicture, 
  getProfilePicture, 
  deleteProfilePicture,
  checkUsernameAvailability,
  changePassword,
  sendEmailVerification,
  verifyEmail,
  resendVerificationEmail
} = require('../controllers/auth.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const optionalAuthMiddleware = require('../middleware/optionalAuth.middleware');

// Routes d'authentification
router.post('/register', register);
router.post('/login', (req, res, next) => {
  console.log('🚀 DEBUG: Route /api/auth/login appelée avec:', req.body);
  login(req, res, next);
});
router.post('/logout', authenticateToken, logout);
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);
router.put('/change-password', authenticateToken, changePassword);

// Route pour vérifier la disponibilité du username
router.get('/check-username/:username', optionalAuthMiddleware, checkUsernameAvailability);

// Routes pour les photos de profil
router.post('/profile-picture', authenticateToken, uploadProfilePicture);
router.get('/profile-picture/:userId', getProfilePicture);
router.delete('/profile-picture', authenticateToken, deleteProfilePicture);

// Routes pour la vérification d'email
router.post('/send-email-verification', sendEmailVerification);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification-email', resendVerificationEmail);

// Maintenance: suppression des comptes non vérifiés >1h (protégé par clé)
router.delete('/maintenance/cleanup-unverified', async (req, res) => {
  try {
    const key = req.query.key;
    if (!process.env.MAINTENANCE_KEY || key !== process.env.MAINTENANCE_KEY) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    const User = require('../models/user.model');
    const EmailVerification = require('../models/emailVerification.model');
    const cutoff = new Date(Date.now() - 60 * 60 * 1000);
    const users = await User.find({ emailVerified: false, createdAt: { $lt: cutoff } }, '_id');
    const ids = users.map(u => u._id);
    if (ids.length) {
      await EmailVerification.deleteMany({ userId: { $in: ids } });
    }
    const delRes = ids.length ? await User.deleteMany({ _id: { $in: ids } }) : { deletedCount: 0 };
    res.json({ success: true, deleted: delRes.deletedCount || 0 });
  } catch (e) {
    console.error('Cleanup error', e);
    res.status(500).json({ success: false, message: 'Erreur cleanup' });
  }
});

// Maintenance route: cleanup empty groups (no active members)
router.delete('/maintenance/cleanup-empty-groups', async (req, res) => {
  try {
    const key = req.query.key || req.headers['x-maintenance-key'];
    if (!process.env.MAINTENANCE_KEY || key !== process.env.MAINTENANCE_KEY) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const { cleanupEmptyGroups } = require('../scripts/cleanupEmptyGroups');
    const stats = await cleanupEmptyGroups({ dryRun: false });
    return res.json({ success: true, stats });
  } catch (err) {
    console.error('Error cleanup empty groups:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Maintenance route: cleanup orphan messages
router.delete('/maintenance/cleanup-orphan-messages', async (req, res) => {
  try {
    const key = req.query.key || req.headers['x-maintenance-key'];
    if (!process.env.MAINTENANCE_KEY || key !== process.env.MAINTENANCE_KEY) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const { cleanupOrphanMessages } = require('../scripts/cleanupOrphanMessages');
    const includeSystem = (req.query.includeSystem === '1');
    const forceAllIfNoUsers = (req.query.forceAll === '1');
    const stats = await cleanupOrphanMessages({ dryRun: false, includeSystem, forceAllIfNoUsers });
    return res.json({ success: true, stats });
  } catch (err) {
    console.error('Error cleanup orphan messages:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
