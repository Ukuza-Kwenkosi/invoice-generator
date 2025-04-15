import { getApiUrl } from '../config';

// Types
interface Product {
    id: string;
    name: string;
    price: number;
    sizes: string[];
    description?: string;
}

interface LoginCredentials {
    username: string;
    password: string;
}

interface ApiResponse {
    success: boolean;
    error?: string;
}

interface InvoiceData {
    customerName: string;
    customerAddress: string;
    customerEmail: string;
    customerPhone: string;
    date: string;
    invoiceNumber: string;
    items: Array<{
        name: string;
        quantity: number;
        price: number;
        size?: string;
        option?: string;
    }>;
}

class ApiService {
    async getProducts(): Promise<Product[]> {
        try {
            const response = await fetch(getApiUrl('/products'));
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching products:', error);
            throw error;
        }
    }

    async login(credentials: LoginCredentials): Promise<ApiResponse> {
        try {
            const response = await fetch(getApiUrl('/auth/login'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials),
                credentials: 'include'
            });
            return await response.json();
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'Network error during login' };
        }
    }

    async logout(): Promise<ApiResponse> {
        try {
            const response = await fetch(getApiUrl('/auth/logout'), {
                method: 'POST',
                credentials: 'include'
            });
            return await response.json();
        } catch (error) {
            console.error('Logout error:', error);
            return { success: false, error: 'Network error during logout' };
        }
    }

    async createInvoice(invoiceData: InvoiceData): Promise<Blob> {
        try {
            const response = await fetch(getApiUrl('/generate-invoice'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(invoiceData),
                credentials: 'include'
            });

            if (!response.ok) {
                // Try to get detailed error message from response
                const errorData = await response.json();
                const errorMessage = errorData.details || errorData.error || 'Failed to generate invoice';
                const error = new Error(errorMessage) as Error & { details?: unknown };
                error.details = errorData; // Attach full error data
                throw error;
            }

            // Check if response is PDF
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/pdf')) {
                throw new Error('Invalid response format - expected PDF');
            }

            return await response.blob();
        } catch (error) {
            console.error('Error creating invoice:', error);
            // Include any additional error details in the error message
            const details = (error as { details?: unknown }).details 
                ? `\nDetails: ${JSON.stringify((error as { details: unknown }).details, null, 2)}` 
                : '';
            throw new Error(`${error instanceof Error ? error.message : 'Unknown error'}${details}`);
        }
    }
}

export const apiService = new ApiService(); 