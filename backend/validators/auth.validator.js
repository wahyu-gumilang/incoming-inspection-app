const { z } = require('zod');
const { THEMES, PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH } = require('../constants/auth');

const newPassword = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `must be at least ${PASSWORD_MIN_LENGTH} characters`)
  .max(PASSWORD_MAX_LENGTH, `must be at most ${PASSWORD_MAX_LENGTH} characters`);

const fullname = z.string().trim().min(1, 'is required').max(50, 'must be at most 50 characters');
const email = z.union([z.literal(''), z.email('must be a valid email').max(100)]);

const loginBody = z.object({
  username: z.string().trim().min(1, 'is required').max(50),
  password: z.string().min(1, 'is required').max(200),
  // "Keep me signed in": a persistent cookie instead of one that ends with the browser session.
  remember: z.boolean().default(true),
});

const updateMeBody = z
  .object({
    fullname: fullname.optional(),
    email: email.optional(),
    theme: z.enum(THEMES).optional(),
  })
  .refine((b) => Object.values(b).some((v) => v !== undefined), { message: 'nothing to update' });

const changePasswordBody = z.object({
  currentPassword: z.string().min(1, 'is required').max(200),
  newPassword,
});

module.exports = { loginBody, updateMeBody, changePasswordBody, newPassword, fullname, email };
