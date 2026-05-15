import User from '../models/User.js';
import Channel from '../models/Channel.js';
import { generateToken } from '../services/authService.js';

// Cross-site cookies (e.g. Vercel + Railway) require SameSite=None + Secure.
const hasNonLocalClient =
  typeof process.env.CLIENT_URL === 'string' &&
  process.env.CLIENT_URL.split(',').some((url) => {
    const u = url.trim().toLowerCase();
    return u.length > 0 && !u.includes('localhost') && !u.includes('127.0.0.1');
  });

const useCrossSiteCookies =
  process.env.NODE_ENV === 'production' ||
  process.env.RAILWAY_ENVIRONMENT === 'production' ||
  hasNonLocalClient;

const cookieOptions = {
  httpOnly: true,
  secure: useCrossSiteCookies,
  sameSite: useCrossSiteCookies ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(409).json({ message: 'User with that email or username already exists' });
    }

    const user = await User.create({
      username,
      email,
      password,
      role: 'user', // Always default to 'user' for safety
    });


    const token = generateToken(user._id, user.role);

    res.cookie('token', token, cookieOptions);

    res.status(201).json({
      token, // Also return token in body for cross-domain deployments
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('Register error:', error.message);
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Username or email already exists' });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user._id, user.role);

    res.cookie('token', token, cookieOptions);

    res.json({
      token, // Also return token in body for cross-domain deployments
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: 'Server error during login' });
  }
};
// POST /api/auth/logout
export const logout = async (req, res) => {
  res.clearCookie('token', cookieOptions);
  res.status(200).json({ message: 'Logged out successfully' });
};
