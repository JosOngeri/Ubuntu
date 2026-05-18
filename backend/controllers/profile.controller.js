const Profile = require('../models/Profile.model');

const profileController = {
  async getProfile(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ msg: 'Unauthorized' });
      const profile = await Profile.findByUserId(userId);
      res.json(profile || {});
    } catch (err) {
      res.status(500).json({ msg: 'Failed to fetch profile', error: err.message });
    }
  },
  async upsertProfile(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ msg: 'Unauthorized' });
      const profile = await Profile.createOrUpdate(userId, req.body || {});
      res.json(profile);
    } catch (err) {
      res.status(400).json({ msg: 'Failed to update profile', error: err.message });
    }
  },
};

module.exports = profileController;
