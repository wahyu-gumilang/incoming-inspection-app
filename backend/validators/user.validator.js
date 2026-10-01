const { z } = require('zod');
const { listQuery } = require('./common.validator');
const { fullname, email } = require('./auth.validator');
const { ROLES, USERNAME_PATTERN } = require('../constants/auth');

const userParams = z.object({ userid: z.coerce.number().int().positive() });

const listUsersQuery = listQuery([
  'username',
  'fullname',
  'role',
  'last_login_at',
  'created_at',
]).extend({
  role: z.enum(ROLES).optional(),
  active: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
});

const lookupQuery = z.object({ role: z.enum(ROLES) });

const username = z
  .string()
  .trim()
  .regex(USERNAME_PATTERN, 'must be 3–50 letters, digits, dots, dashes or underscores');

const createUserBody = z.object({
  username,
  fullname,
  email: email.optional(),
  role: z.enum(ROLES),
});

const updateUserBody = z
  .object({
    fullname: fullname.optional(),
    email: email.optional(),
    role: z.enum(ROLES).optional(),
    active: z.boolean().optional(),
  })
  .refine((b) => Object.values(b).some((v) => v !== undefined), { message: 'nothing to update' });

module.exports = {
  userParams,
  listUsersQuery,
  lookupQuery,
  createUserBody,
  updateUserBody,
  username,
};
