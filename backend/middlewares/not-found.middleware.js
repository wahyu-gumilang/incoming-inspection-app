const { fail } = require('../utils/response');

function notFound(req, res) {
  return fail(res, 404, 'NOT_FOUND', 'Route not found');
}

module.exports = notFound;
