export function buildTerritoryWhere(req) {
  if (req.user.role === "lider territorial") {
    if (req.query.destacamentoId) {
      return {
        destacamentoId: req.query.destacamentoId,
        destacamento: { territorioId: req.user.territorioId }
      };
    } else {
      return {
        destacamento: { territorioId: req.user.territorioId }
      };
    }
  }
  
  return {
    destacamentoId: req.user.destacamentoId
  };
}

export function requireNotTerritorial(req, res, next) {
  if (req.user.role === "lider territorial") {
    return res.status(403).json({ msg: "Acceso denegado: Modo de solo lectura" });
  }
  next();
}
