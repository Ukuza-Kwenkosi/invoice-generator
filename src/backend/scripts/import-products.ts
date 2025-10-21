import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';

// Load environment variables
config({ path: path.join(__dirname, '../.env') });

const productsToImport = [
    {
        "options": [
            ""
        ],
        "sizes": [
            {
                "size": "2.4m+",
                "price": 65
            }
        ],
        "description": "",
        "id": "Pinboard Fittings",
        "name": "Pinboard Fittings"
    },
    {
        "options": [
            ""
        ],
        "sizes": [
            {
                "size": "Standard",
                "price": 1600
            },
            {
                "size": "ECO",
                "price": 9500
            },
            {
                "size": "Premium",
                "price": 9500
            }
        ],
        "description": "Transport to your premises( Offloading to be provided by yourselves)",
        "id": "transport",
        "name": "Transport"
    },
    {
        "options": [
            ""
        ],
        "sizes": [
            {
                "size": "2.4m+",
                "price": 95
            }
        ],
        "description": "",
        "id": "Classic writing board fittings",
        "name": "Classic writing board fitting"
    },
    {
        "options": [
            "Colours: Green/ Grey/ Brown/ Red / Beige"
        ],
        "sizes": [
            {
                "size": "1.2m (h) x 2.4m (w)",
                "price": 2384
            },
            {
                "size": "1.2m (h) x 2.0m (w)",
                "price": 2154
            },
            {
                "size": "1.2m (h) x 1.8m (w)",
                "price": 1998
            }
        ],
        "description": "C/W FELT pinning material and aluminum frame.",
        "id": "felt-pinboards",
        "name": "Felt Pinboards"
    },
    {
        "id": "pinboard-fittings",
        "name": "Pinboard Fittings",
        "sizes": [
            {
                "size": "2.4m+",
                "price": 65
            }
        ]
    },
    {
        "options": [
            "Chalk",
            "White"
        ],
        "sizes": [
            {
                "size": "1.2m (h) x 2.4m (w)",
                "price": 3320
            }
        ],
        "description": "C/W aluminium frame and pentray.",
        "id": "eco---magnetic-writing-boards",
        "name": "ECO - Magnetic Writing Boards"
    },
    {
        "options": [
            ""
        ],
        "sizes": [
            {
                "size": "Standard",
                "price": 2070
            }
        ],
        "description": " Extra over for - Crating",
        "id": "crating",
        "name": "Crating"
    },
    {
        "options": [
            "Chalk",
            "White"
        ],
        "sizes": [
            {
                "size": "1.14m h x 3.6m",
                "price": 18609
            },
            {
                "size": "1.14m h x 4.8m",
                "price": 21470
            }
        ],
        "description": "Consisting of:\n1 x Centre board, 2 x Side boards and 2 x  Swing boards.",
        "id": "classic-magnetic-steel---folding",
        "name": "Classic Magnetic F/T (5pc set) Writing board"
    },
    {
        "options": [
            "Chalk",
            "white"
        ],
        "sizes": [
            {
                "size": "standard",
                "price": 1242
            }
        ],
        "description": "50mm Lines and Squares",
        "id": "screening",
        "name": "Screening"
    },
    {
        "id": "fittings",
        "name": "Fittings",
        "sizes": [
            {
                "size": "Standard",
                "price": 65
            }
        ]
    },
    {
        "options": [
            "Chalk",
            "White"
        ],
        "sizes": [
            {
                "size": "1.2m h x 2.4m",
                "price": 4790
            }
        ],
        "description": "C/W Aluminium frame & Pentray",
        "id": "Premium Magnetic",
        "name": "Premium Magnetic Writing Board"
    },
    {
        "options": [
            "Chalk",
            "White"
        ],
        "sizes": [
            {
                "size": "1.14m h x 1.8m w",
                "price": 2428
            },
            {
                "size": "1.14m h x 1.8m w ",
                "price": 1773
            }
        ],
        "description": "Custom Magnetic Writing boards",
        "id": "custom-non-vitreous",
        "name": "Non Vitreous"
    },
    {
        "options": [
            ""
        ],
        "sizes": [
            {
                "size": "2.4m+",
                "price": 65
            }
        ],
        "description": "",
        "id": "Pinboard Fitting",
        "name": "Pinboard Fittings"
    },
    {
        "options": [
            "Chalk/White"
        ],
        "sizes": [
            {
                "size": "1.2m (h) x 2.4m (w)",
                "price": 2590
            },
            {
                "size": "1.2m (h) x 2.0 ( w)",
                "price": 2190
            },
            {
                "size": "1.2m (h) x 1.8m (w) ",
                "price": 2093
            }
        ],
        "description": "c/w aluminium frame and pentray.",
        "id": "non---magnetic-writing-boards",
        "name": "Non - Magnetic Writing Board"
    },
    {
        "options": [
            "Chalk",
            "White"
        ],
        "sizes": [
            {
                "size": "1.14m h x 2.4m",
                "price": 5445
            },
            {
                "size": "1.14m h x 1.8m w",
                "price": 3355
            }
        ],
        "description": "c/w aluminium chalkrail.",
        "id": "classic-magnetic-steel",
        "name": "Classic Magnetic Steel Writing board."
    },
    {
        "options": [
            "Chalk",
            "White"
        ],
        "sizes": [
            {
                "size": "1.2m (h) x 3.6m (w)",
                "price": 9814
            },
            {
                "size": "1.2m (h) x 4.8m (w)",
                "price": 14499
            }
        ],
        "description": "Consists of: 1 Centre Panel, 2 double sided swing leafs and 2 side boards",
        "id": "magnetic-h/t-sets-",
        "name": "Magnetic H/T (5pc) set Writing Board"
    },
    {
        "options": [
            "White",
            "Chalk"
        ],
        "sizes": [
            {
                "size": "1.2m (h) x 2.4m (w)",
                "price": 3367
            },
            {
                "size": "1.2m (h) x 1900m (w)",
                "price": 3207
            }
        ],
        "description": "C/W aluminum frame and pentray.",
        "id": "magnetic-standard-writing-boards-",
        "name": "Standard Magnetic Writing Board "
    },
    {
        "options": [
            "Grey",
            "Brown",
            "Blue"
        ],
        "sizes": [
            {
                "size": "1.2m h x 2.4m w",
                "price": 2504
            },
            {
                "size": "1.2m h x 1.8m w",
                "price": 1702
            },
            {
                "size": "0.9m (h) x 2.4m (w)",
                "price": 1866
            },
            {
                "size": "1.2m (h) x 3.0m (w)",
                "price": 3231
            },
            {
                "size": "1.2m (h) x 1.65m (w)",
                "price": 2037
            },
            {
                "size": "1.2m (h) x 1.48m (w)",
                "price": 1732
            },
            {
                "size": "0.9m (h) x 1.2m (w)",
                "price": 1226
            },
            {
                "size": "1.8m (w) x 9.0m (h)",
                "price": 919
            }
        ],
        "description": "Carpet pinboard with Aluminium frame ",
        "id": "carpet-pinboard",
        "name": "Carpet Pinboard"
    },
    {
        "id": "classic-writing-board-fittings",
        "name": "Classic writing board fittings",
        "sizes": [
            {
                "size": "2.4m+",
                "price": 95
            }
        ]
    }
];

interface ImportProduct {
    id: string;
    name: string;
    sizes: Array<{ size: string; price: number }>;
    options?: string[];
    description?: string;
}

async function importProducts() {
    const supabaseUrl = process.env.SUPABASE_API_URL;
    const supabaseKey = process.env.SUPABASE_API_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Missing Supabase credentials in .env file');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🚀 Starting product import...\n');

    // Get existing products to track order_num
    const { data: existingProducts } = await supabase
        .from('products')
        .select('name, order_num')
        .order('order_num', { ascending: false })
        .limit(1);

    let nextOrderNum = existingProducts && existingProducts.length > 0 
        ? (existingProducts[0].order_num || 0) + 1 
        : 9; // Start after existing 8 products

    // Clean and deduplicate products
    const cleanedProducts = new Map<string, any>();

    for (const product of productsToImport as ImportProduct[]) {
        // Clean options - remove empty strings
        const cleanOptions = (product.options || [])
            .filter(opt => opt && opt.trim() !== '')
            .map(opt => opt.trim());

        // Use product name as the key to deduplicate
        const key = product.name.trim().toLowerCase();
        
        if (!cleanedProducts.has(key)) {
            cleanedProducts.set(key, {
                name: product.name.trim(),
                sizes: product.sizes,
                options: cleanOptions,
                description: (product.description || '').trim(),
            });
        }
    }

    console.log(`📦 Found ${cleanedProducts.size} unique products to import\n`);

    let imported = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const [_, productData] of cleanedProducts) {
        try {
            // Check if product already exists
            const { data: existing } = await supabase
                .from('products')
                .select('*')
                .eq('name', productData.name)
                .maybeSingle();

            if (existing) {
                // Update existing product
                const { error } = await supabase
                    .from('products')
                    .update({
                        sizes: productData.sizes,
                        options: productData.options,
                        description: productData.description,
                    })
                    .eq('name', productData.name);

                if (error) {
                    console.error(`❌ Error updating "${productData.name}":`, error.message);
                    errors++;
                } else {
                    console.log(`✏️  Updated: ${productData.name}`);
                    updated++;
                }
            } else {
                // Insert new product
                const { error } = await supabase
                    .from('products')
                    .insert({
                        name: productData.name,
                        sizes: productData.sizes,
                        options: productData.options,
                        description: productData.description,
                        order_num: nextOrderNum++,
                    });

                if (error) {
                    console.error(`❌ Error importing "${productData.name}":`, error.message);
                    errors++;
                } else {
                    console.log(`✅ Imported: ${productData.name}`);
                    imported++;
                }
            }
        } catch (error: any) {
            console.error(`❌ Exception for "${productData.name}":`, error.message);
            errors++;
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Import Summary:');
    console.log('='.repeat(60));
    console.log(`✅ New products imported: ${imported}`);
    console.log(`✏️  Existing products updated: ${updated}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
    console.log('='.repeat(60));

    if (errors === 0) {
        console.log('\n🎉 Import completed successfully!');
    } else {
        console.log('\n⚠️  Import completed with errors. Please review the output above.');
    }
}

// Run the import
importProducts()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('💥 Fatal error:', error);
        process.exit(1);
    });

