export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    sizes: string[];
}

export interface Database {
    getAllProducts(): Promise<Product[]>;
    // Add other methods as needed
} 