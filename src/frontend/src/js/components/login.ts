import { getApiUrl } from '../config';
import { apiService } from '../services/api';

interface LoginResponse {
  success: boolean;
  data?: {
    token: string;
  };
  error?: string;
}

class LoginComponent {
  private form: HTMLFormElement | null;
  private errorMessage: HTMLElement | null;
  private errorText: HTMLElement | null;
  private usernameInput: HTMLInputElement | null;
  private passwordInput: HTMLInputElement | null;

  constructor() {
    this.form = document.getElementById('loginForm') as HTMLFormElement;
    this.errorMessage = document.getElementById('errorMessage');
    this.errorText = document.getElementById('errorText');
    this.usernameInput = document.getElementById('username') as HTMLInputElement;
    this.passwordInput = document.getElementById('password') as HTMLInputElement;
    this.initialize();
  }

  private initialize(): void {
    if (this.form) {
      this.form.addEventListener('submit', this.handleSubmit.bind(this));
    }
  }

  private async handleSubmit(event: Event): Promise<void> {
    event.preventDefault();
    this.hideError();

    if (!this.usernameInput || !this.passwordInput) {
      this.showError('Form elements not found');
      return;
    }

    const username = this.usernameInput.value;
    const password = this.passwordInput.value;

    try {
      const response = await apiService.login({ username, password });

      if (response.success) {
        // Store the token
        localStorage.setItem('token', response.data?.token || '');
        // Redirect to backoffice
        const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        window.location.href = isDevelopment ? '/backoffice' : '/backoffice.html';
      } else {
        this.showError(response.error || 'Login failed');
      }
    } catch (error) {
      this.showError('An error occurred during login');
    }
  }

  private showError(message: string): void {
    if (this.errorMessage && this.errorText) {
      this.errorText.textContent = message;
      this.errorMessage.classList.remove('hidden');
    }
  }

  private hideError(): void {
    if (this.errorMessage) {
      this.errorMessage.classList.add('hidden');
    }
  }
}

// Initialize the login component when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new LoginComponent();
}); 