const AppError = require('../utils/app-error');

const PARTS = ['params', 'query', 'body'];

function toDetails(part, issues) {
  return issues.map((issue) => ({
    field: issue.path.length ? issue.path.join('.') : part,
    message: issue.message,
  }));
}

// Express 5 exposes req.query through a getter, so parsed values can't be
// written back onto req. Controllers read them from req.validated instead.
function validate(schemas) {
  return (req, res, next) => {
    const validated = {};
    const details = [];

    for (const part of PARTS) {
      if (!schemas[part]) continue;
      const result = schemas[part].safeParse(req[part] ?? {});
      if (result.success) {
        validated[part] = result.data;
      } else {
        details.push(...toDetails(part, result.error.issues));
      }
    }

    if (details.length) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Request validation failed', details);
    }
    req.validated = validated;
    next();
  };
}

module.exports = validate;
