const jwt = require('jsonwebtoken');

// Middleware que verifica se o usuário está logado e extrai dados do JWT
function requireLogin(req, res, next) {
  if (req.session && req.session.user && req.session.token) {
    // Decodifica o JWT da sessão para pegar o role atualizado
    try {
      const decoded = jwt.verify(req.session.token, process.env.JWT_SECRET);
      req.userId = decoded.userId;
      req.userName = decoded.nome;
      req.userRole = decoded.role;
    } catch (err) {
      // Se o token expirou ou é inválido, usa os dados da sessão como fallback
      req.userId = req.session.user.userId || req.session.user.id;
      req.userName = req.session.user.nome;
      req.userRole = req.session.user.role;
    }
    return next();
  }
  // Se veio de uma chamada API (Postman/curl), retorna 401 JSON
  if (req.headers.accept && req.headers.accept.includes('application/json')) {
    return res.status(401).json({ error: 'Não autenticado.' });
  }
  req.flash('error', 'Você precisa estar logado para acessar esta página.');
  return res.redirect('/login');
}

// Middleware que verifica se o usuário é admin — retorna 403 real
function requireAdmin(req, res, next) {
  // Primeiro garante que está logado
  requireLogin(req, res, () => {
    if (req.userRole === 'admin') {
      return next();
    }
    // Enforcement real: 403 Forbidden
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.status(403).json({ error: 'Acesso negado. Permissão de administrador necessária.' });
    }
    req.flash('error', 'Acesso restrito a administradores.');
    return res.redirect('/filmes');
  });
}

module.exports = { requireLogin, requireAdmin };
