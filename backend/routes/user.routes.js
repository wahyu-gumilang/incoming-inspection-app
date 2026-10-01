const { Router } = require('express');
const userController = require('../controllers/user.controller');
const validate = require('../middlewares/validate.middleware');
const { requireRole } = require('../middlewares/auth.middleware');
const { ROLE } = require('../constants/auth');
const v = require('../validators/user.validator');

const router = Router();

// Any signed-in user: the "Checked by" dropdown needs it.
router.get('/lookup', validate({ query: v.lookupQuery }), userController.lookup);

router.use(requireRole(ROLE.ADMIN));
router.get('/', validate({ query: v.listUsersQuery }), userController.list);
router.post('/', validate({ body: v.createUserBody }), userController.create);
router.get('/:userid', validate({ params: v.userParams }), userController.get);
router.put(
  '/:userid',
  validate({ params: v.userParams, body: v.updateUserBody }),
  userController.update,
);
router.post(
  '/:userid/reset-password',
  validate({ params: v.userParams }),
  userController.resetPassword,
);

module.exports = router;
