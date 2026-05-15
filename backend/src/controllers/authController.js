const { signup, login, getMe } = require("../services/authService");

async function signupController(req, res, next) {
  try {
    const { name, email, phone, password, role } = req.validated.body;
    const { user, token } = await signup({ name, email, phone, password, role });
    return res.status(201).json({
      ok: true,
      data: {
        token,
        user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, isActive: user.isActive },
      },
    });
  } catch (e) {
    return next(e);
  }
}

async function loginController(req, res, next) {
  try {
    const { email, password } = req.validated.body;
    const { user, token } = await login({ email, password });
    return res.json({
      ok: true,
      data: {
        token,
        user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, isActive: user.isActive },
      },
    });
  } catch (e) {
    return next(e);
  }
}

async function meController(req, res, next) {
  try {
    const user = await getMe(req.auth.sub);
    return res.json({
      ok: true,
      data: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, isActive: user.isActive },
    });
  } catch (e) {
    return next(e);
  }
}

module.exports = { signupController, loginController, meController };
