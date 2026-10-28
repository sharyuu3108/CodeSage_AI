import { reviewCode, optimizeCode, convertCode } from '../services/geminiService.js';
import { AnalysisHistory } from '../models/AnalysisHistory.js';
import { OptimizationHistory } from '../models/OptimizationHistory.js';
import { ConversionHistory } from '../models/ConversionHistory.js';

const DAILY_QUOTA = parseInt(process.env.AI_DAILY_QUOTA_PER_USER, 10) || 50;

/**
 * Calculate user AI operations in the current UTC day
 */
export const getUserDailyUsage = async (userId) => {
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const [reviewsToday, optimizationsToday, conversionsToday] = await Promise.all([
    AnalysisHistory.countDocuments({ userId, createdAt: { $gte: startOfDay } }),
    OptimizationHistory.countDocuments({ userId, createdAt: { $gte: startOfDay } }),
    ConversionHistory.countDocuments({ userId, createdAt: { $gte: startOfDay } }),
  ]);

  return reviewsToday + optimizationsToday + conversionsToday;
};

/**
 * Check if user exceeded daily quota
 */
const verifyQuota = async (userId) => {
  const usage = await getUserDailyUsage(userId);
  if (usage >= DAILY_QUOTA) {
    return {
      exceeded: true,
      usage,
      limit: DAILY_QUOTA,
    };
  }
  return {
    exceeded: false,
    usage,
    limit: DAILY_QUOTA,
  };
};

/**
 * POST /api/ai/review
 * Perform AI static code analysis and record in AnalysisHistory
 */
export const handleReview = async (req, res) => {
  try {
    const { language, code, sessionId } = req.body;
    const userId = req.user.id;

    const quota = await verifyQuota(userId);
    if (quota.exceeded) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'DAILY_QUOTA_EXCEEDED',
          message: `Daily AI request limit reached (${quota.limit} requests/day). Quota resets at 00:00 UTC.`,
          used: quota.usage,
          limit: quota.limit,
        },
      });
    }

    const analysis = await reviewCode({ code, language });

    const historyRecord = await AnalysisHistory.create({
      userId,
      sessionId: sessionId || null,
      language,
      code,
      analysis,
    });

    return res.status(200).json({
      success: true,
      analysis,
      historyId: historyRecord._id,
      quota: {
        used: quota.usage + 1,
        limit: quota.limit,
        remaining: Math.max(0, quota.limit - (quota.usage + 1)),
      },
    });
  } catch (error) {
    console.error('Code review error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'REVIEW_FAILED',
        message: 'An error occurred during code analysis.',
      },
    });
  }
};

/**
 * POST /api/ai/optimize
 * Perform code optimization and save to OptimizationHistory
 */
export const handleOptimize = async (req, res) => {
  try {
    const { language, code, targetGoal = 'performance', sessionId } = req.body;
    const userId = req.user.id;

    const quota = await verifyQuota(userId);
    if (quota.exceeded) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'DAILY_QUOTA_EXCEEDED',
          message: `Daily AI request limit reached (${quota.limit} requests/day). Quota resets at 00:00 UTC.`,
          used: quota.usage,
          limit: quota.limit,
        },
      });
    }

    const optimization = await optimizeCode({ code, language, targetGoal });

    const historyRecord = await OptimizationHistory.create({
      userId,
      sessionId: sessionId || null,
      language,
      originalCode: code,
      optimizedCode: optimization.optimizedCode,
      explanation: optimization.explanation,
    });

    return res.status(200).json({
      success: true,
      optimization,
      historyId: historyRecord._id,
      quota: {
        used: quota.usage + 1,
        limit: quota.limit,
        remaining: Math.max(0, quota.limit - (quota.usage + 1)),
      },
    });
  } catch (error) {
    console.error('Code optimization error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'OPTIMIZE_FAILED',
        message: 'An error occurred during code optimization.',
      },
    });
  }
};

/**
 * POST /api/ai/convert
 * Transpile/convert code across languages and save to ConversionHistory
 */
export const handleConvert = async (req, res) => {
  try {
    const { sourceLanguage, targetLanguage, code, sessionId } = req.body;
    const userId = req.user.id;

    const quota = await verifyQuota(userId);
    if (quota.exceeded) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'DAILY_QUOTA_EXCEEDED',
          message: `Daily AI request limit reached (${quota.limit} requests/day). Quota resets at 00:00 UTC.`,
          used: quota.usage,
          limit: quota.limit,
        },
      });
    }

    const conversion = await convertCode({ code, sourceLanguage, targetLanguage });

    const historyRecord = await ConversionHistory.create({
      userId,
      sessionId: sessionId || null,
      sourceLanguage,
      targetLanguage,
      sourceCode: code,
      convertedCode: conversion.convertedCode,
      explanation: conversion.explanation,
    });

    return res.status(200).json({
      success: true,
      conversion,
      historyId: historyRecord._id,
      quota: {
        used: quota.usage + 1,
        limit: quota.limit,
        remaining: Math.max(0, quota.limit - (quota.usage + 1)),
      },
    });
  } catch (error) {
    console.error('Code conversion error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'CONVERT_FAILED',
        message: 'An error occurred during code conversion.',
      },
    });
  }
};

/**
 * GET /api/ai/quota
 * Retrieve current quota usage for authenticated user
 */
export const getAiQuota = async (req, res) => {
  try {
    const userId = req.user.id;
    const used = await getUserDailyUsage(userId);

    return res.status(200).json({
      success: true,
      quota: {
        used,
        limit: DAILY_QUOTA,
        remaining: Math.max(0, DAILY_QUOTA - used),
        resetsAt: new Date(new Date().setUTCHours(24, 0, 0, 0)).toISOString(),
      },
    });
  } catch (error) {
    console.error('Get quota error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'QUOTA_FETCH_FAILED',
        message: 'Could not fetch AI quota.',
      },
    });
  }
};
