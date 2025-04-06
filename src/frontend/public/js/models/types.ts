export interface ItemData {
    name: string;
    size: string;
    option?: string;
    quantity: number;
    price: number;
    description?: string;
}

export interface InvoiceData {
    customerName: string;
    customerAddress: string;
    customerEmail: string;
    customerPhone: string;
    invoiceNumber: string;
    date: string;
    items: ItemData[];
}

export interface LoginCredentials {
    username: string;
    password: string;
}

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
}

export interface ProductSize {
    size: string;
    price: number;
}

export interface Product {
    name: string;
    sizes: ProductSize[];
    options?: string[];
    description?: string;
} 