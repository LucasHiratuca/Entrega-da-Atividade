// Middleware que verifica se o usuário tem um JWT válido na sessão
function requireLogin(req, res, next) {
  if (req.session && req.session.user) {
    // Injeta dados do usuário no objeto req para facilitar uso nas rotas
    req.userId = req.session.user.userId;
    req.userName = req.session.user.nome;
    req.userRole = req.session.user.role;
    return next();
  }
  req.flash('error', 'Você precisa estar logado para acessar esta página.');
  return res.redirect('/login');
}

// Middleware que verifica se o usuário é admin
function requireAdmin(req, res, next) {
  if (req.session && req.session.user && req.session.user.role === 'admin') {
    req.userId = req.session.user.userId;
    req.userName = req.session.user.nome;
    req.userRole = req.session.user.role;
    return next();
  }
  req.flash('error', 'Acesso restrito a administradores.');
  return res.redirect('/filmes');
}

module.exports = { requireLogin, requireAdmin };
