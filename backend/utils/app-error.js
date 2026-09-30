// Expected failures (not found, duplicate, wrong status, business rule).
// The error handler sends these as-is; any other error becomes a 500.
class AppError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

module.exports = AppError;
