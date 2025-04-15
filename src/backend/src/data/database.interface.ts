export interface Size {
    size: string;
    price: number;
}

export interface Product {
    id?: string;
    name: string;
    sizes: Size[];
    options?: string[];
    description?: string;
    order?: number;
}

export interface Database {
    getAllProducts(): Promise<Product[]>;
    // Add other methods as needed
} 