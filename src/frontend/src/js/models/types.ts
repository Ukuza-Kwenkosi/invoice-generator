export interface Product {
    name: string;
    sizes: Array<{
        size: string;
        price: number;
    }>;
    options?: string[];
    description?: string;
}

export interface Size {
    size: string;
    price: number;
    options?: Option[];
}

export interface Option {
    name: string;
    price: number;
}

export interface CustomerDetails {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    customerAddress: string;
}

export interface SelectedItem {
    name: string;
    size: string;
    quantity: number;
    price: number;
    option?: string;
    description?: string;
} 