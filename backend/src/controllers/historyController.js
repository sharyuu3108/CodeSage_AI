import { AnalysisHistory } from '../models/AnalysisHistory.js';
import { OptimizationHistory } from '../models/OptimizationHistory.js';
import { ConversionHistory } from '../models/ConversionHistory.js';
import { CodeSession } from '../models/CodeSession.js';

/**
 * GET /api/history
 * Returns aggregated recent activity stream for the authenticated user
 */
export const getAggregatedHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = Math.min(parseInt(req.query.limit, 10) || 30, 100);

    const [reviews, optimizations, conversions, sessions] = await Promise.all([
      AnalysisHistory.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('language code analysis createdAt')
        .lean(),
      OptimizationHistory.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('language originalCode optimizedCode explanation createdAt')
        .lean(),
      ConversionHistory.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('sourceLanguage targetLanguage sourceCode convertedCode explanation createdAt')
        .lean(),
      CodeSession.find({ userId })
        .sort({ updatedAt: -1 })
        .limit(limit)
        .select('title language code createdAt updatedAt')
        .lean(),
    ]);

    // Normalize and tag items
    const normalizedReviews = reviews.map((r) => ({
      id: r._id,
      type: 'review',
      title: `Code Review (${r.language.toUpperCase()})`,
      language: r.language,
      code: r.code,
      details: r.analysis,
      score: r.analysis?.overallScore || null,
      issuesCount: r.analysis?.issues?.length || 0,
      createdAt: r.createdAt,
    }));

    const normalizedOptimizations = optimizations.map((o) => ({
      id: o._id,
      type: 'optimization',
      title: `Optimization (${o.language.toUpperCase()})`,
      language: o.language,
      originalCode: o.originalCode,
      optimizedCode: o.optimizedCode,
      explanation: o.explanation,
      createdAt: o.createdAt,
    }));

    const normalizedConversions = conversions.map((c) => ({
      id: c._id,
      type: 'conversion',
      title: `Conversion (${c.sourceLanguage.toUpperCase()} → ${c.targetLanguage.toUpperCase()})`,
      sourceLanguage: c.sourceLanguage,
      targetLanguage: c.targetLanguage,
      sourceCode: c.sourceCode,
      convertedCode: c.convertedCode,
      explanation: c.explanation,
      createdAt: c.createdAt,
    }));

    const normalizedSessions = sessions.map((s) => ({
      id: s._id,
      type: 'session',
      title: s.title,
      language: s.language,
      code: s.code,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));

    const combined = [
      ...normalizedReviews,
      ...normalizedOptimizations,
      ...normalizedConversions,
      ...normalizedSessions,
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.status(200).json({
      success: true,
      items: combined.slice(0, limit),
      counts: {
        reviews: reviews.length,
        optimizations: optimizations.length,
        conversions: conversions.length,
        sessions: sessions.length,
        total: combined.length,
      },
    });
  } catch (error) {
    console.error('Aggregated history error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'HISTORY_FETCH_FAILED', message: 'Could not fetch history.' },
    });
  }
};

/**
 * GET /api/history/reviews
 */
export const getReviewsHistory = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 15));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      AnalysisHistory.find({ userId: req.user.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AnalysisHistory.countDocuments({ userId: req.user.id }),
    ]);

    return res.status(200).json({
      success: true,
      items: items.map((i) => ({
        id: i._id,
        language: i.language,
        code: i.code,
        analysis: i.analysis,
        createdAt: i.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Reviews history error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'REVIEWS_FETCH_FAILED', message: 'Could not fetch reviews history.' },
    });
  }
};

/**
 * GET /api/history/optimizations
 */
export const getOptimizationsHistory = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 15));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      OptimizationHistory.find({ userId: req.user.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      OptimizationHistory.countDocuments({ userId: req.user.id }),
    ]);

    return res.status(200).json({
      success: true,
      items: items.map((i) => ({
        id: i._id,
        language: i.language,
        originalCode: i.originalCode,
        optimizedCode: i.optimizedCode,
        explanation: i.explanation,
        createdAt: i.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Optimizations history error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'OPTIMIZATIONS_FETCH_FAILED', message: 'Could not fetch optimizations history.' },
    });
  }
};

/**
 * GET /api/history/conversions
 */
export const getConversionsHistory = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 15));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      ConversionHistory.find({ userId: req.user.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ConversionHistory.countDocuments({ userId: req.user.id }),
    ]);

    return res.status(200).json({
      success: true,
      items: items.map((i) => ({
        id: i._id,
        sourceLanguage: i.sourceLanguage,
        targetLanguage: i.targetLanguage,
        sourceCode: i.sourceCode,
        convertedCode: i.convertedCode,
        explanation: i.explanation,
        createdAt: i.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Conversions history error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'CONVERSIONS_FETCH_FAILED', message: 'Could not fetch conversions history.' },
    });
  }
};

/**
 * DELETE /api/history/:type/:id
 * Delete a specific history entry
 */
export const deleteHistoryItem = async (req, res) => {
  try {
    const { type, id } = req.params;
    const userId = req.user.id;

    let result;
    if (type === 'review') {
      result = await AnalysisHistory.findOneAndDelete({ _id: id, userId });
    } else if (type === 'optimization') {
      result = await OptimizationHistory.findOneAndDelete({ _id: id, userId });
    } else if (type === 'conversion') {
      result = await ConversionHistory.findOneAndDelete({ _id: id, userId });
    } else if (type === 'session') {
      result = await CodeSession.findOneAndDelete({ _id: id, userId });
    } else {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_TYPE', message: 'Invalid history item type.' },
      });
    }

    if (!result) {
      return res.status(404).json({
        success: false,
        error: { code: 'ITEM_NOT_FOUND', message: 'History record not found or access denied.' },
      });
    }

    return res.status(200).json({
      success: true,
      message: 'History item deleted successfully.',
    });
  } catch (error) {
    console.error('Delete history item error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'DELETE_ITEM_FAILED', message: 'Could not delete history record.' },
    });
  }
};

/**
 * DELETE /api/history
 * Clears all user AI histories (reviews, optimizations, conversions)
 */
export const clearAllHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    await Promise.all([
      AnalysisHistory.deleteMany({ userId }),
      OptimizationHistory.deleteMany({ userId }),
      ConversionHistory.deleteMany({ userId }),
    ]);

    return res.status(200).json({
      success: true,
      message: 'All code analysis and conversion history has been cleared.',
    });
  } catch (error) {
    console.error('Clear history error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'CLEAR_HISTORY_FAILED', message: 'Could not clear history.' },
    });
  }
};
