import { Request, Response, NextFunction } from 'express';
import { AuthService } from './authService';

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ 
            success: false, 
            error: 'No token provided' 
        });
    }

    const payload = AuthService.verifyToken(token);
    if (!payload) {
        return res.status(403).json({ 
            success: false, 
            error: 'Invalid token' 
        });
    }

    // Add the user payload to the request
    (req as any).user = payload;
    next();
}; 