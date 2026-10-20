const validateSignupRequest = (req, res, next) => {
  const { name, email, password } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({
      message: 'Name is required and must be a valid string',
      data: {},
      success: false,
      err: {}
    });
  }

  if (!email || typeof email !== 'string') {
    return res.status(400).json({
      message: 'Email is required',
      data: {},
      success: false,
      err: {}
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      message: 'Please provide a valid email address',
      data: {},
      success: false,
      err: {}
    });
  }

  if (!password || password.length < 6) {
    return res.status(400).json({
      message: 'Password must be at least 6 characters long',
      data: {},
      success: false,
      err: {}
    });
  }

  next();
};

module.exports = validateSignupRequest;