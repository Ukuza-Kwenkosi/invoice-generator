// Types
interface ApiConfig {
    baseUrl: string;
}

// API Configuration
export const API_CONFIG: ApiConfig = {
    baseUrl: window.location.hostname === 'localhost'
        ? 'http://localhost:3000'
        : '' // Empty base URL for production since we use direct paths
};

// Environment check
export const isDevelopment: boolean = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Get the appropriate API URL based on environment
export function getApiUrl(path: string): string {
    return `${API_CONFIG.baseUrl}${path}`;
} 