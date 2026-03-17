import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET  = process.env.JWT_SECRET || 'slack_clone_secret_key_dev';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';

export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (candidatePassword, hashedPassword) => {
  return bcrypt.compare(candidatePassword, hashedPassword);
};

export const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
};

export const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};
