export interface JwtPayload {
    username: string;
    iat?: number;
    exp?: number;
}

export interface LoginCredentials {
    username: string;
    password: string;
}

export interface AuthResponse {
    success: boolean;
    error?: string;
    data?: {
        token: string;
    };
} 