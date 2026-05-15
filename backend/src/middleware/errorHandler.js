function errorHandler(err, req, res, next) {
  const status = err.statusCode || err.status || 500;
  const message = err.message || "Internal Server Error";
  const details = err.details || undefined;

  if (process.env.NODE_ENV !== "test") {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  res.status(status).json({
    ok: false,
    error: {
      message,
      ...(details ? { details } : {}),
    },
  });
}

module.exports = { errorHandler };
