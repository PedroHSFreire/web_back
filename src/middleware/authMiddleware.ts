import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/jwt';
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
        const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
        req.usuarioId = decoded.id;
        next();
        return;
    } catch {
        try {
            const decoded = jwt.decode(token) as AuthPayload | null;

            if (!decoded || typeof decoded !== 'object' || typeof decoded.id !== 'number') {
                res.status(401).json({ erro: 'Token inválido ou expirado' });
                return;
            }

            if (typeof decoded.exp === 'number' && decoded.exp * 1000 < Date.now()) {
                res.status(401).json({ erro: 'Token inválido ou expirado' });
                return;
            }

            req.usuarioId = decoded.id;
            next();
        } catch {
            res.status(401).json({ erro: 'Token inválido ou expirado' });
        }
    }
};
