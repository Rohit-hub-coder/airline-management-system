const validateSignInRequest = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || typeof email !== 'string') {
    return res.status(400).json({
      message: 'Email is required',
      data: {},
      success: false,
      err: {}
    });
  }

  if (!password) {
    return res.status(400).json({
      message: 'Password is required',
      data: {},
      success: false,
      err: {}
    });
  }

  next();
};

module.exports = validateSignInRequest;