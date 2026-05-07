const User = require('../models/User.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendEmail } = require('../utils/email');

const buildResetLink = (resetToken) => `${process.env.FRONTEND_URL || 'https://ubuntu-hrms12.vercel.app'}/reset-password?token=${resetToken}`;

const signAuthToken = (user) => new Promise((resolve, reject) => {
  const payload = { id: user.id, role: user.role, status: user.status };

  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
    if (err) {
      reject(err);
      return;
    }
    resolve(token);
  });
});

// Register user
const register = async (req, res) => {
  const { username, password, role, email } = req.body;
  try {
    let user = await User.findOne({ username });
    if (user) return res.status(400).json({ msg: 'User already exists' });

    user = new User({ username, password, role, email });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    const token = await signAuthToken(user);
    res.json({ token });
  } catch (err) {
    if (err?.code === '23505') {
      return res.status(400).json({ msg: 'User already exists' });
    }

    res.status(500).send('Server error');
  }
};

// Login user
const login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

    if (user.mustChangePassword) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

      user.resetToken = resetTokenHash;
      user.resetTokenExpire = new Date(Date.now() + 30 * 60 * 1000);
      await user.save();

      return res.status(200).json({
        mustChangePassword: true,
        resetToken,
        msg: 'Password change required before first login',
      });
    }

    const token = await signAuthToken(user);
    res.json({ token, mustChangePassword: false });
  } catch (err) {
    res.status(500).send('Server error');
  }
};

// Forgot Password - Generate reset token
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      // For security, don't reveal if email exists or not
      // Just return success either way
      return res.json({ msg: 'If an account with that email exists, a password reset link will be sent' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // Set token and expiry (1 hour from now)
    user.resetToken = resetTokenHash;
    user.resetTokenExpire = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    const resetLink = buildResetLink(resetToken);

    await sendEmail({
      to: user.email,
      subject: 'Ubuntu HRMS Password Reset',
      text: `Hello ${user.username},\n\nUse this link to reset your password: ${resetLink}\n\nThis link expires in 1 hour.`,
      html: `<p>Hello ${user.username},</p><p>Use this link to reset your password:</p><p><a href="${resetLink}">${resetLink}</a></p><p>This link expires in 1 hour.</p>`,
    });

    res.json({ msg: 'If an account with that email exists, a password reset link will be sent' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// Reset Password - Verify token and update password
const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    if (!token || !newPassword) {
      return res.status(400).json({ msg: 'Token and password are required' });
    }

    // Hash the token to compare with stored hash
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid reset token
    const user = await User.findOne({
      resetToken: resetTokenHash,
      resetTokenExpire: { $gt: Date.now() } // Token not expired
    });

    if (!user) {
      return res.status(400).json({ msg: 'Invalid or expired reset token' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    
    // Clear reset token
    user.resetToken = null;
    user.resetTokenExpire = null;
    user.mustChangePassword = false;
    user.updatedAt = new Date();
    
    await user.save();

    res.json({ msg: 'Password reset successful' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = { register, login, forgotPassword, resetPassword };