import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthPayload } from '../types';

declare global {
    namespace Express {
        interface Request {
            usuarioId?: number;
        }
    }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        res.status(401).json({ erro: 'Token não fornecido' });
        return;
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        res.status(401).json({ erro: 'Token inválido' });
        return;
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as AuthPayload;
        req.usuarioId = decoded.id;
        next();
    } catch (error) {
        res.status(401).json({ erro: 'Token inválido ou expirado' });
    }
};