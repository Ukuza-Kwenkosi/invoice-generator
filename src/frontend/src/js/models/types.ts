export interface Product {
    name: string;
    description?: string;
    sizes: Size[];
    options?: string[];
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
    option?: string;
    quantity: number;
    price: number;
} 