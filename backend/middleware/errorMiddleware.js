const errorMiddleware = (err, req, res, next) => {
  console.error('❌ Error:', err.message);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: messages.join(', ') });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({ message: `${field} already exists` });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Invalid token' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Token expired' });
  }

  // Default
  const status = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  console.error(`💥 [${new Date().toISOString()}] ${req.method} ${req.path}:`, {
    status,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });

  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};

export default errorMiddleware;
