import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction, RequestHandler } from 'express';

// estendendo o Request do Express para permitir que ele tenha um campo user, além do que já existe como body, params, query, etc.
export interface AuthenticatedRequest extends Request {
  user?: any;
}

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  //e aqui ele pega o Bearer token tirando o Bearer e ficando só com o token
  const token = req.header("Authorization")?.replace("Bearer ", "");

  //req.header("Authorization") = Bearer + token
  console.log("Aqui é o req header: " + req.header("Authorization"));

  if (!token) {
    res.status(401).json({ msg: "Acesso negado token não fornecido." });
    return;
  }

  try {
    // Decodifica o token e extrai os dados que foram incluídos na criação com o jwt.sign(),
    // como id e userName do usuário.
    // Exemplo: jwt.sign({ id: user._id, userName: user.userName }, secret)
    const decoded = jwt.verify(token, process.env.SECRET_KEY as string);
    req.user = decoded;
    // agora eu posso usar o req.user controller
    console.log(req.user);
    /* 
    {
      id: '67f6d489b4eb6ecebd4c7c72',
      userName: 'kaique games',
      iat: 1744302058
    }
    esse iat é quando o token foi criado pelo jwt.sign()
    */
    next();
    //continua com a rota chamada
  } catch (err) {
    res.status(401).json({ msg: "Token inválido" });
  }
};
