const express = require('express');
const vendorController = require('../controllers/vendor.controller');
const validate = require('../middlewares/validate.middleware');
const { requireRole } = require('../middlewares/auth.middleware');
const { ROLE } = require('../constants/auth');
const v = require('../validators/vendor.validator');

const router = express.Router();
const admin = requireRole(ROLE.ADMIN);

router.get('/', validate({ query: v.listVendorsQuery }), vendorController.list);
router.get('/lookup', validate({ query: v.lookupQuery }), vendorController.lookup);
// The CSV file is sent as the raw request body (Content-Type: text/csv).
router.post(
  '/import',
  admin,
  express.text({ type: ['text/csv', 'text/plain'], limit: '1mb' }),
  vendorController.importCsv,
);
router.get('/:vendaccount', validate({ params: v.vendorParams }), vendorController.get);
router.post('/', admin, validate({ body: v.createVendorBody }), vendorController.create);
router.put(
  '/:vendaccount',
  admin,
  validate({ params: v.vendorParams, body: v.renameVendorBody }),
  vendorController.rename,
);
router.delete(
  '/:vendaccount',
  admin,
  validate({ params: v.vendorParams }),
  vendorController.remove,
);

module.exports = router;
