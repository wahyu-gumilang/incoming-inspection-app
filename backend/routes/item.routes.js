const { Router } = require('express');
const itemController = require('../controllers/item.controller');
const validate = require('../middlewares/validate.middleware');
const { requireRole } = require('../middlewares/auth.middleware');
const { ROLE } = require('../constants/auth');
const v = require('../validators/item.validator');

const router = Router();
const admin = requireRole(ROLE.ADMIN);

// Reading is for every signed-in user; changing master data is for Admins.
router.get('/', validate({ query: v.listItemsQuery }), itemController.list);
router.get('/lookup', validate({ query: v.lookupQuery }), itemController.lookup);
router.get('/:itemId', validate({ params: v.itemParams }), itemController.get);
router.post('/', admin, validate({ body: v.createItemBody }), itemController.create);
router.put(
  '/:itemId',
  admin,
  validate({ params: v.itemParams, body: v.renameItemBody }),
  itemController.rename,
);

// Standards are addressed by type + item name, sent in the body or (for DELETE) the query.
router.post(
  '/:itemId/inspect-items',
  admin,
  validate({ params: v.itemParams, body: v.standardBody }),
  itemController.addStandard,
);
router.put(
  '/:itemId/inspect-items',
  admin,
  validate({ params: v.itemParams, body: v.standardBody }),
  itemController.updateStandard,
);
router.delete(
  '/:itemId/inspect-items',
  admin,
  validate({ params: v.itemParams, query: v.standardKeyQuery }),
  itemController.deleteStandard,
);

module.exports = router;
