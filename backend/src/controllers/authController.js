import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { setAuthCookie, clearAuthCookie, generateToken } from '../middleware/authMiddleware.js';

// Pre-generated dummy hash for constant-time comparison when user is not found (timing attack defense)
const DUMMY_HASH = '$2a$12$D8t6rCknL82/lHqJc.k8e.s3s5iG0n1h6a5j7k8l9m0n1o2p3q4r5';

/**
 * Format user payload for client responses (strips sensitive fields)
 */
const formatUserResponse = (user) => ({
  id: user._id,
  name: user.name,
  username: user.username,
  email: user.email,
  profilePicture: user.profilePicture,
  bio: user.bio,
  location: user.location,
  githubUsername: user.githubUsername,
  linkedinUrl: user.linkedinUrl,
  website: user.website,
  skills: user.skills,
  preferredLanguages: user.preferredLanguages,
  defaultLanguage: user.defaultLanguage,
  createdAt: user.createdAt,
});

/**
 * POST /api/auth/register
 */
export const register = async (req, res) => {
  try {
    const { name, username, email, password } = req.body;

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedUsername = username.toLowerCase().trim();

    // Check for existing email
    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'EMAIL_EXISTS',
          message: 'An account with this email already exists.',
        },
      });
    }

    // Check for existing username
    const existingUsername = await User.findOne({ username: normalizedUsername });
    if (existingUsername) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'USERNAME_EXISTS',
          message: 'Username is already taken.',
        },
      });
    }

    // Create user (password is automatically hashed via pre-save hook)
    const user = new User({
      name,
      username: normalizedUsername,
      email: normalizedEmail,
      password,
    });

    await user.save();

    // Issue JWT in HTTP-only cookie
    const token = generateToken(user._id);
    setAuthCookie(res, token);

    return res.status(201).json({
      success: true,
      user: formatUserResponse(user),
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'REGISTRATION_FAILED',
        message: 'Unable to complete registration. Please try again.',
      },
    });
  }
};

/**
 * POST /api/auth/login
 */
export const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;
    const normalized = identifier.toLowerCase().trim();

    const user = await User.findOne({
      $or: [{ email: normalized }, { username: normalized }],
    }).select('+password');

    // Constant-time defense against user enumeration timing attacks
    if (!user) {
      await bcrypt.compare(password, DUMMY_HASH);
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email/username or password.',
        },
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email/username or password.',
        },
      });
    }

    const token = generateToken(user._id);
    setAuthCookie(res, token);

    return res.status(200).json({
      success: true,
      user: formatUserResponse(user),
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'LOGIN_FAILED',
        message: 'An unexpected error occurred during login.',
      },
    });
  }
};

/**
 * POST /api/auth/logout
 */
export const logout = (req, res) => {
  clearAuthCookie(res);
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

/**
 * GET /api/auth/me
 */
export const getMe = (req, res) => {
  return res.status(200).json({
    success: true,
    user: formatUserResponse(req.user),
  });
};

/**
 * POST /api/auth/change-password
 */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' },
      });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_PASSWORD',
          message: 'Current password is incorrect.',
        },
      });
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'PASSWORD_CHANGE_FAILED',
        message: 'Could not change password.',
      },
    });
  }
};

/**
 * DELETE /api/auth/account (Section 25a & Section 42 item 8)
 * Permanently deletes user account and cascaded data
 */
export const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' },
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_PASSWORD',
          message: 'Incorrect password. Account deletion cancelled.',
        },
      });
    }

    // Dynamic import to prevent circular dependency if models are instantiated later
    const mongoose = (await import('mongoose')).default;
    const db = mongoose.connection.db;

    // Cascade delete any user sessions and histories if collections exist
    const collections = ['codesessions', 'analysishistories', 'optimizationhistories', 'conversionhistories'];
    for (const col of collections) {
      if (db) {
        try {
          await db.collection(col).deleteMany({ userId: user._id });
        } catch {
          // Collection might not exist yet; safe to ignore
        }
      }
    }

    await User.findByIdAndDelete(user._id);
    clearAuthCookie(res);

    return res.status(200).json({
      success: true,
      message: 'Account and all associated records permanently deleted.',
    });
  } catch (error) {
    console.error('Delete account error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_ACCOUNT_FAILED',
        message: 'Unable to delete account.',
      },
    });
  }
};

/**
 * PUT /api/auth/profile
 * Updates profile using strict allow-list (Section 42 Item 8)
 */
export const updateProfile = async (req, res) => {
  try {
    const allowedUpdates = req.body; // Already filtered and validated strictly by updateProfileSchema

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: allowedUpdates },
      { new: true, runValidators: true }
    ).select('-password');

    return res.status(200).json({
      success: true,
      user: formatUserResponse(updatedUser),
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'PROFILE_UPDATE_FAILED',
        message: 'Unable to update profile.',
      },
    });
  }
};
