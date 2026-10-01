const AppError = require('../utils/app-error');
const { fail } = require('../utils/response');

function errorHandler(err, req, res, next) {
  // Express can only close the connection once a response has started.
  if (res.headersSent) return next(err);

  if (err instanceof AppError) {
    return fail(res, err.status, err.code, err.message, err.details);
  }
  if (err.type === 'entity.parse.failed') {
    return fail(res, 400, 'VALIDATION_ERROR', 'Request body is not valid JSON');
  }
  if (err.code === 'ER_DUP_ENTRY') {
    return fail(res, 409, 'DUPLICATE_KEY', 'A record with the same key already exists');
  }

  // Stack traces and SQL messages stay in the server log.
  console.error(err);
  return fail(res, 500, 'INTERNAL_ERROR', 'Internal server error');
}

module.exports = errorHandler;
