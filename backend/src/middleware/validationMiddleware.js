import { z } from 'zod';

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name cannot exceed 100 characters'),
    username: z
      .string()
      .trim()
      .min(3, 'Username must be at least 3 characters')
      .max(30, 'Username cannot exceed 30 characters')
      .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain alphanumeric characters, underscores, and dashes'),
    email: z.string().trim().email('Invalid email address').max(255),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password cannot exceed 128 characters')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
  })
  .strict()
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const loginSchema = z
  .object({
    identifier: z.string().trim().min(1, 'Email or username is required'),
    password: z.string().min(1, 'Password is required'),
  })
  .strict();

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters')
      .max(128, 'New password cannot exceed 128 characters')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmNewPassword: z.string(),
  })
  .strict()
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'New passwords do not match',
    path: ['confirmNewPassword'],
  });

// Strict allow-list for profile update (Section 42 Item 8 Mass Assignment defense)
export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    bio: z.string().trim().max(500).optional(),
    location: z.string().trim().max(100).optional(),
    githubUsername: z.string().trim().max(100).optional(),
    linkedinUrl: z.string().trim().max(200).optional(),
    website: z.string().trim().max(200).optional(),
    skills: z.array(z.string().trim().max(50)).max(30).optional(),
    preferredLanguages: z
      .array(z.enum(['python', 'javascript', 'java', 'cpp']))
      .max(4)
      .optional(),
    defaultLanguage: z.enum(['python', 'javascript', 'java', 'cpp']).optional(),
    profilePicture: z.string().trim().max(500).optional(),
  })
  .strict(); // Rejects any extra/admin/role fields

export const deleteAccountSchema = z
  .object({
    password: z.string().min(1, 'Password confirmation is required to delete account'),
  })
  .strict();

export const reviewSchema = z
  .object({
    language: z.enum(['python', 'javascript', 'java', 'cpp'], {
      errorMap: () => ({ message: 'Language must be python, javascript, java, or cpp' }),
    }),
    code: z
      .string()
      .min(1, 'Code cannot be empty')
      .max(51200, 'Code cannot exceed 50 KB (51,200 bytes)'),
    sessionId: z.string().nullable().optional(),
  })
  .strict();

export const optimizeSchema = z
  .object({
    language: z.enum(['python', 'javascript', 'java', 'cpp'], {
      errorMap: () => ({ message: 'Language must be python, javascript, java, or cpp' }),
    }),
    targetGoal: z.enum(['performance', 'readability', 'memory']).default('performance'),
    code: z
      .string()
      .min(1, 'Code cannot be empty')
      .max(51200, 'Code cannot exceed 50 KB (51,200 bytes)'),
    sessionId: z.string().nullable().optional(),
  })
  .strict();

export const convertSchema = z
  .object({
    sourceLanguage: z.enum(['python', 'javascript', 'java', 'cpp'], {
      errorMap: () => ({ message: 'Source language must be python, javascript, java, or cpp' }),
    }),
    targetLanguage: z.enum(['python', 'javascript', 'java', 'cpp'], {
      errorMap: () => ({ message: 'Target language must be python, javascript, java, or cpp' }),
    }),
    code: z
      .string()
      .min(1, 'Code cannot be empty')
      .max(51200, 'Code cannot exceed 50 KB (51,200 bytes)'),
    sessionId: z.string().nullable().optional(),
  })
  .strict()
  .refine((data) => data.sourceLanguage !== data.targetLanguage, {
    message: 'Source and target languages must be different',
    path: ['targetLanguage'],
  });

export const sessionSchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required').max(100, 'Title cannot exceed 100 characters'),
    language: z.enum(['python', 'javascript', 'java', 'cpp']),
    code: z
      .string()
      .min(1, 'Code is required')
      .max(51200, 'Code cannot exceed 50 KB (51,200 bytes)'),
  })
  .strict();

export const updateSessionSchema = z
  .object({
    title: z.string().trim().min(1).max(100).optional(),
    language: z.enum(['python', 'javascript', 'java', 'cpp']).optional(),
    code: z.string().min(1).max(51200).optional(),
  })
  .strict();

/**
 * Express middleware helper to validate request body with a Zod schema
 */
export const validateBody = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const issue = result.error.errors[0];
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: issue.message,
        path: issue.path.join('.'),
      },
    });
  }
  req.body = result.data;
  next();
};

