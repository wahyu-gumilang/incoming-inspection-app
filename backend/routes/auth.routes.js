const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const validate = require('../middlewares/validate.middleware');
const { requireAuth } = require('../middlewares/auth.middleware');
const { loginBody, updateMeBody, changePasswordBody } = require('../validators/auth.validator');

const router = Router();

router.post('/login', validate({ body: loginBody }), authController.login);
router.post('/logout', authController.logout);

// Still reachable with a temporary password, so the user can change it.
router.get('/me', requireAuth, authController.me);
router.put('/me', requireAuth, validate({ body: updateMeBody }), authController.updateMe);
router.put(
  '/me/password',
  requireAuth,
  validate({ body: changePasswordBody }),
  authController.changePassword,
);

module.exports = router;
