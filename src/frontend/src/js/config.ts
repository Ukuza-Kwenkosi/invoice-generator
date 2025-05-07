// Types
interface ApiConfig {
    baseUrl: string;
}

// Development mode flag
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Build-time configuration
declare const __API_BASE_URL__: string;

// API Configuration
export const API_CONFIG: ApiConfig = {
    baseUrl: isDevelopment ? 'http://localhost:3000' : 'https://dctxoovo0tr3t.cloudfront.net'
};

// Get the appropriate API URL based on environment
export function getApiUrl(path: string): string {
    return `${API_CONFIG.baseUrl}${path}`;
} 