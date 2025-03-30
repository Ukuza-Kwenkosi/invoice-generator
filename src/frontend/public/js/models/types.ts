export interface ItemData {
    name: string;
    description: string;
    price: number;
    size?: string;
    sizes?: Array<{
        size: string;
        price: number;
    }>;
    options?: string[];
}

export interface Customer {
    name: string;
    address: string;
    email: string;
    phone: string;
} 