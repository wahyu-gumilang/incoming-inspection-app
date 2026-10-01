const { Router } = require('express');
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const itemRoutes = require('./item.routes');
const { requireAuth, requirePasswordChanged } = require('../middlewares/auth.middleware');

const router = Router();

// Public: health and sign-in. /auth protects its own routes.
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);

// Everything else needs a signed-in user who isn't on a temporary password.
const signedIn = [requireAuth, requirePasswordChanged];
router.use('/users', ...signedIn, userRoutes);
router.use('/items', ...signedIn, itemRoutes);

module.exports = router;
