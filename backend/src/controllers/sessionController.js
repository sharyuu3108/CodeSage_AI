import { CodeSession } from '../models/CodeSession.js';

/**
 * GET /api/sessions
 * List all saved code sessions for the authenticated user
 */
export const listSessions = async (req, res) => {
  try {
    const sessions = await CodeSession.find({ userId: req.user.id })
      .sort({ updatedAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      sessions: sessions.map((s) => ({
        id: s._id,
        title: s.title,
        language: s.language,
        code: s.code,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
    });
  } catch (error) {
    console.error('List sessions error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'SESSION_LIST_FAILED', message: 'Could not retrieve sessions.' },
    });
  }
};

/**
 * POST /api/sessions
 * Create a new code session
 */
export const createSession = async (req, res) => {
  try {
    const { title, language, code } = req.body;
    const session = await CodeSession.create({
      userId: req.user.id,
      title: title || 'Untitled Session',
      language,
      code,
    });

    return res.status(201).json({
      success: true,
      session: {
        id: session._id,
        title: session.title,
        language: session.language,
        code: session.code,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      },
    });
  } catch (error) {
    console.error('Create session error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'SESSION_CREATE_FAILED', message: 'Could not create session.' },
    });
  }
};

/**
 * GET /api/sessions/:id
 * Retrieve a specific code session (strictly isolated to owner)
 */
export const getSession = async (req, res) => {
  try {
    const session = await CodeSession.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: { code: 'SESSION_NOT_FOUND', message: 'Session not found or access denied.' },
      });
    }

    return res.status(200).json({
      success: true,
      session: {
        id: session._id,
        title: session.title,
        language: session.language,
        code: session.code,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      },
    });
  } catch (error) {
    console.error('Get session error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'SESSION_FETCH_FAILED', message: 'Could not fetch session.' },
    });
  }
};

/**
 * PUT /api/sessions/:id
 * Update an existing code session
 */
export const updateSession = async (req, res) => {
  try {
    const session = await CodeSession.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: { code: 'SESSION_NOT_FOUND', message: 'Session not found or access denied.' },
      });
    }

    if (req.body.title !== undefined) session.title = req.body.title;
    if (req.body.language !== undefined) session.language = req.body.language;
    if (req.body.code !== undefined) session.code = req.body.code;

    await session.save();

    return res.status(200).json({
      success: true,
      session: {
        id: session._id,
        title: session.title,
        language: session.language,
        code: session.code,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      },
    });
  } catch (error) {
    console.error('Update session error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'SESSION_UPDATE_FAILED', message: 'Could not update session.' },
    });
  }
};

/**
 * DELETE /api/sessions/:id
 * Delete a code session
 */
export const deleteSession = async (req, res) => {
  try {
    const session = await CodeSession.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: { code: 'SESSION_NOT_FOUND', message: 'Session not found or access denied.' },
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Session deleted successfully.',
    });
  } catch (error) {
    console.error('Delete session error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'SESSION_DELETE_FAILED', message: 'Could not delete session.' },
    });
  }
};
