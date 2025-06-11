import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extender la interfaz Request de Express para incluir 'user'
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        email: string;
        role: 'admin' | 'supervisor' | 'user';
      };
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'superSecretJWTKeyExample123';

export const protect = (req: Request, res: Response, next: NextFunction) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Verificar token
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; email: string; role: 'admin' | 'supervisor' | 'user' };

      req.user = decoded;
      next();
    } catch (error) {
      console.error('Error en el middleware de autenticación:', error);
      res.status(401).json({ message: 'No autorizado, token fallido.' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'No autorizado, no hay token.' });
  }
};

// Middleware para roles específicos
export const authorize = (roles: Array<'admin' | 'supervisor' | 'user'>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'No autorizado, rol insuficiente.' });
    }
    next();
  };
};