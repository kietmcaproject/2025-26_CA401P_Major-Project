function validate(schema) {
  return (req, res, next) => {
    try {
      const parsed = schema.parse({
        body: req.body,
        params: req.params,
        query: req.query,
      });
      req.validated = parsed;
      return next();
    } catch (err) {
      return res.status(400).json({
        ok: false,
        error: { message: "Validation error", details: err?.issues || err?.errors || err },
      });
    }
  };
}

module.exports = { validate };
