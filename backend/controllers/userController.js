import User from '../models/User.js';

// GET /api/users/profile
export const getProfile = async (req, res) => {
  try {
    res.json(req.user);
  } catch (error) {
    console.error('Get profile error:', error.message);
    res.status(500).json({ message: 'Server error getting profile' });
  }
};

// PUT /api/users/profile
export const updateProfile = async (req, res) => {
  try {
    const { username, avatar } = req.body;
    const updates = {};
    if (username) updates.username = username;
    if (avatar !== undefined) updates.avatar = avatar;

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    res.json(user);
  } catch (error) {
    console.error('Update profile error:', error.message);
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Username already taken' });
    }
    res.status(500).json({ message: 'Server error updating profile' });
  }
};

// GET /api/users
export const listUsers = async (req, res) => {
  try {
    const users = await User.find().select('username email role avatar createdAt').lean();
    res.json(users);
  } catch (error) {
    console.error('List users error:', error.message);
    res.status(500).json({ message: 'Server error listing users' });
  }
};
