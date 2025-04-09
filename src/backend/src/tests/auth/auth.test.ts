import { AuthService } from '../../auth/authService.js';

describe('Authentication Service', () => {
    it('should login with valid credentials', async () => {
        const response = await AuthService.login({
            username: process.env.ADMIN_USERNAME || 'admin',
            password: process.env.ADMIN_PASSWORD || 'admin'
        });

        expect(response.success).toBe(true);
        expect(response.data?.token).toBeDefined();
    });

    it('should fail login with invalid credentials', async () => {
        const response = await AuthService.login({
            username: 'wrong',
            password: 'wrong'
        });

        expect(response.success).toBe(false);
        expect(response.error).toBeDefined();
    });

    it('should verify valid token', async () => {
        // First get a valid token
        const loginResponse = await AuthService.login({
            username: process.env.ADMIN_USERNAME || 'admin',
            password: process.env.ADMIN_PASSWORD || 'admin'
        });

        if (!loginResponse.success || !loginResponse.data?.token) {
            throw new Error('Failed to get token for test');
        }

        const payload = AuthService.verifyToken(loginResponse.data.token);
        expect(payload).not.toBeNull();
        expect(payload?.username).toBe(process.env.ADMIN_USERNAME || 'admin');
    });

    it('should fail to verify invalid token', () => {
        const payload = AuthService.verifyToken('invalid.token.here');
        expect(payload).toBeNull();
    });
}); 