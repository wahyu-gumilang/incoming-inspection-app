const { Router } = require('express');
const inspectionController = require('../controllers/inspection.controller');
const validate = require('../middlewares/validate.middleware');
const v = require('../validators/inspection.validator');

const router = Router();

// Every role inspects. Who may change a given draft (its creator or an Admin) is
// decided per inspection in the service.
router.get('/', validate({ query: v.listInspectionsQuery }), inspectionController.list);
router.post('/', validate({ body: v.createInspectionBody }), inspectionController.create);
router.get('/:inspectnum', validate({ params: v.inspectionParams }), inspectionController.get);
router.put(
  '/:inspectnum',
  validate({ params: v.inspectionParams, body: v.updateInspectionBody }),
  inspectionController.update,
);
router.delete(
  '/:inspectnum',
  validate({ params: v.inspectionParams }),
  inspectionController.remove,
);
router.put(
  '/:inspectnum/deliveries/:n',
  validate({ params: v.deliveryParams, body: v.deliveryBody }),
  inspectionController.saveDelivery,
);
router.delete(
  '/:inspectnum/deliveries/:n',
  validate({ params: v.deliveryParams }),
  inspectionController.removeDelivery,
);

module.exports = router;
