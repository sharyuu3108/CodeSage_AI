import { User } from '../models/User.js';
import { AnalysisHistory } from '../models/AnalysisHistory.js';
import { OptimizationHistory } from '../models/OptimizationHistory.js';
import { ConversionHistory } from '../models/ConversionHistory.js';
import { CodeSession } from '../models/CodeSession.js';

/**
 * Format user profile response
 */
const formatProfile = (user, stats) => ({
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
  stats,
});

/**
 * Helper to compute real developer statistics for authenticated user
 */
export const getUserStatistics = async (userId) => {
  const [totalReviews, totalOptimizations, totalConversions, totalSavedSessions] = await Promise.all([
    AnalysisHistory.countDocuments({ userId }),
    OptimizationHistory.countDocuments({ userId }),
    ConversionHistory.countDocuments({ userId }),
    CodeSession.countDocuments({ userId }),
  ]);

  return {
    totalReviews,
    totalOptimizations,
    totalConversions,
    totalSavedSessions,
  };
};

/**
 * GET /api/profile
 * Retrieves authenticated user profile along with computed statistics
 */
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User profile not found' },
      });
    }

    const stats = await getUserStatistics(req.user.id);

    return res.status(200).json({
      success: true,
      profile: formatProfile(user, stats),
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'PROFILE_FETCH_FAILED', message: 'Unable to retrieve profile' },
    });
  }
};

/**
 * GET /api/profile/stats
 * Returns isolated statistics for the authenticated user
 */
export const getStats = async (req, res) => {
  try {
    const stats = await getUserStatistics(req.user.id);
    return res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'STATS_FETCH_FAILED', message: 'Unable to retrieve statistics' },
    });
  }
};
