const { Router } = require('express');
const aqlController = require('../controllers/aql.controller');
const validate = require('../middlewares/validate.middleware');
const { requireRole } = require('../middlewares/auth.middleware');
const { ROLE } = require('../constants/auth');
const v = require('../validators/aql.validator');

const router = Router();
const admin = requireRole(ROLE.ADMIN);

router.get('/lookup', validate({ query: v.lookupQuery }), aqlController.lookup);
router.get('/plans', aqlController.listPlans);
router.get('/plans/:planId', validate({ params: v.planParams }), aqlController.getPlan);
router.put(
  '/plans/:planId/rows',
  admin,
  validate({ params: v.planParams, body: v.replaceRowsBody }),
  aqlController.replaceRows,
);
router.put(
  '/plans/:planId/default',
  admin,
  validate({ params: v.planParams }),
  aqlController.setDefault,
);

module.exports = router;
