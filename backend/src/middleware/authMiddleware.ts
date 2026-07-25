import jwt, { type JwtPayload } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

interface AuthenticatedUser extends JwtPayload {
  id: string;
  userName: string;
}

// estendendo o Request do Express para permitir que ele tenha um campo user, além do que já existe como body, params, query, etc.
export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authorization = req.header("Authorization");
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : undefined;

  if (!token) {
    return res.status(401).json({ msg: "Acesso negado: token não fornecido." });
  }

  try {
    const secret = process.env.SECRET_KEY;
    if (!secret) {
      return res.status(500).json({ msg: "Configuração de autenticação ausente." });
    }

    const decoded = jwt.verify(token, secret);
    if (typeof decoded === "string" || typeof decoded.id !== "string" || typeof decoded.userName !== "string") {
      return res.status(401).json({ msg: "Token inválido." });
    }

    req.user = { ...decoded, id: decoded.id, userName: decoded.userName };
    next();
  } catch (err) {
    return res.status(401).json({ msg: "Token inválido." });
  }
};
