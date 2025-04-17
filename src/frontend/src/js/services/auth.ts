import { apiService } from './api';

export class AuthService {
    private errorMessage: HTMLElement | null;
    private errorText: HTMLElement | null;

    constructor() {
        this.errorMessage = document.getElementById('errorMessage');
        this.errorText = document.getElementById('errorText');
    }

    async handleLogin(event: Event): Promise<void> {
        event.preventDefault();
        
        const usernameInput = document.getElementById('username') as HTMLInputElement;
        const passwordInput = document.getElementById('password') as HTMLInputElement;
        
        const username = usernameInput.value;
        const password = passwordInput.value;

        try {
            const response = await apiService.login({ username, password });
            if (response.success) {
                window.location.href = '/dashboard';
            } else {
                this.showError(response.error || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('An error occurred during login');
        }
    }

    async handleLogout(): Promise<void> {
        try {
            const response = await apiService.logout();
            if (response.success) {
                window.location.href = '/login.html';
            } else {
                this.showError(response.error || 'Logout failed');
            }
        } catch (error) {
            console.error('Logout error:', error);
            this.showError('An error occurred during logout');
        }
    }

    private showError(message: string): void {
        if (this.errorMessage && this.errorText) {
            this.errorText.textContent = message;
            this.errorMessage.classList.remove('hidden');
        }
    }
} 