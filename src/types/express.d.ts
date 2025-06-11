// src/types/express.d.ts
import { Request } from 'express';

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

export interface AuthenticatedRequest extends Request {
    user?: {
        userId: number;
        email: string;
        role: 'admin' | 'supervisor' | 'user';
    };
}