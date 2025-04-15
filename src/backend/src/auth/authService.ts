import jwt from 'jsonwebtoken';
import { LoginCredentials, AuthResponse, JwtPayload } from './types.js';

export class AuthService {
    private static readonly JWT_SECRET = process.env.JWT_SECRET;
    private static readonly JWT_EXPIRES_IN = '24h';

    static async login(credentials: LoginCredentials): Promise<AuthResponse> {
        if (!this.JWT_SECRET) {
            throw new Error('JWT_SECRET environment variable is not set');
        }

        const { username, password } = credentials;

        if (!username || !password) {
            return {
                success: false,
                error: 'Username and password are required'
            };
        }

        // Check credentials against environment variables
        if (username === process.env.ADMIN_USERNAME && 
            password === process.env.ADMIN_PASSWORD) {
            
            // Generate JWT token
            const token = jwt.sign(
                { username },
                this.JWT_SECRET,
                { expiresIn: this.JWT_EXPIRES_IN }
            );

            return {
                success: true,
                data: { token }
            };
        }

        return {
            success: false,
            error: 'Invalid credentials'
        };
    }

    static verifyToken(token: string): JwtPayload | null {
        if (!this.JWT_SECRET) {
            throw new Error('JWT_SECRET environment variable is not set');
        }

        try {
            return jwt.verify(token, this.JWT_SECRET) as JwtPayload;
        } catch (error) {
            return null;
        }
    }
} 