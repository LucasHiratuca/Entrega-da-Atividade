// Middleware que protege rotas que exigem login
function requireLogin(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  req.flash('error', 'Você precisa estar logado para acessar esta página.');
  return res.redirect('/login');
}

module.exports = { requireLogin };
