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