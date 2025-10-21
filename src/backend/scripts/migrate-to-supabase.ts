import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_API_URL;
const supabaseKey = process.env.SUPABASE_API_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Supabase credentials not found in environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

const products = [
    {
        name: "Carpet Pinboard",
        sizes: [
            {
                size: "1.2m h x 2.4m w",
                price: 2136
            },
            {
                size: "1.2m h x 1.8m w",
                price: 1702
            }
        ],
        options: ["Grey", "Brown", "Blue"],
        description: "Carpet pinboard with Aluminium frame"
    },
    {
        name: "Classic Magnetic Steel",
        sizes: [
            {
                size: "1.14m h x 2.4m",
                price: 4735
            }
        ],
        options: ["Chalk", "White"],
        description: "Steel writing board c/w aluminium chalkrail"
    },
    {
        name: "Classic Magnetic Steel - Folding",
        sizes: [
            {
                size: "1.14m h x 3.6m",
                price: 14496
            },
            {
                size: "1.14m h x 4.8m",
                price: 18972
            }
        ],
        options: ["Chalk", "White"],
        description: "Classic steel folding writing boards c/w aluminum chalkrail(5 pc set)"
    },
    {
        name: "Premium Magnetic",
        sizes: [
            {
                size: "1.2m h x 2.4m",
                price: 4039
            }
        ],
        options: ["Chalk", "White"],
        description: "Steel writing board with Aluminium frame & Pentray"
    },
    {
        name: "Pinboard Fittings",
        sizes: [
            {
                size: "2.4m+",
                price: 65
            }
        ],
        options: [],
        description: ""
    },
    {
        name: "Classic writing board fittings",
        sizes: [
            {
                size: "2.4m+",
                price: 95
            }
        ],
        options: [],
        description: ""
    },
    {
        name: "Crating",
        sizes: [
            {
                size: "Standard",
                price: 1500
            }
        ],
        options: [],
        description: ""
    },
    {
        name: "Fittings",
        sizes: [
            {
                size: "Standard",
                price: 65
            }
        ],
        options: [],
        description: ""
    }
];

async function migrateData() {
    try {
        console.log('Starting data migration...');

        // Delete all existing products first
        const { error: deleteError } = await supabase
            .from('products')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

        if (deleteError) {
            throw deleteError;
        }
        console.log('Cleared existing products');

        // Insert all products
        const { data, error } = await supabase
            .from('products')
            .insert(products.map((product, index) => ({
                ...product,
                order_num: index + 1
            })));

        if (error) {
            throw error;
        }

        console.log('Successfully migrated', products.length, 'products to Supabase');
        console.log('Data:', data);
    } catch (error) {
        console.error('Error migrating data:', error);
        process.exit(1);
    }
}

// Run the migration
migrateData();
