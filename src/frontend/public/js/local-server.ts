import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import session from 'express-session';
import bodyParser from 'body-parser';
import flash from 'connect-flash';

// Product interface
interface Product {
    name: string;
    sizes: {
        size: string;
        price: number;
    }[];
    options?: string[];
    description?: string;
}

// Extend session type
declare module 'express-session' {
    interface SessionData {
        isAuthenticated: boolean;
    }
}

export const app = express();
const port = 3000;

// Data file paths
const getDataPaths = () => {
    const testPath = process.env.TEST_DATA_PATH;
    if (testPath) {
        return {
            dataDir: path.dirname(testPath),
            dataPath: testPath
        };
    }
    return {
        dataDir: path.join(__dirname, '../data'),
        dataPath: path.join(__dirname, '../data/data.json')
    };
};

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Add CSP headers
app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com https://cdn.tailwindcss.com; " +
        "style-src 'self' 'unsafe-inline' data: https://cdn.jsdelivr.net; " +
        "font-src 'self' data:; " +
        "img-src 'self' data:; " +
        "connect-src 'self'"
    );
    next();
});

// Middleware
app.use(express.static(path.join(__dirname, '..'), {
    setHeaders: (res: Response, filePath: string) => {
        if (filePath.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        } else if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        } else if (filePath.endsWith('.html')) {
            res.setHeader('Content-Type', 'text/html');
        }
    }
}));

// Serve js files
app.use('/js', express.static(path.join(__dirname, '.'), {
    setHeaders: (res: Response, _filePath: string) => {
        res.setHeader('Content-Type', 'application/javascript');
    }
}));

// Serve templates directory
app.use('/templates', express.static(path.join(__dirname, '../templates'), {
    setHeaders: (res: Response, filePath: string) => {
        if (filePath.endsWith('.html')) {
            res.setHeader('Content-Type', 'text/html');
        }
    }
}));

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false
}));
app.use(flash());

// Authentication middleware
const isAuthenticated = (req: Request, res: Response, next: NextFunction): void => {
    if (req.session?.isAuthenticated) {
        next();
    } else {
        res.redirect('/login');
    }
};

// Login page
app.get('/login', (req: Request, res: Response) => {
    res.render('login', { messages: req.flash() });
});

// Login endpoint
app.post('/login', (req: Request, res: Response): void => {
    const { username, password } = req.body;
    if (!username || !password) {
        req.flash('error', 'Username and password are required');
        res.redirect('/login');
        return;
    }

    if (username === 'admin' && password === 'admin') {
        req.session.isAuthenticated = true;
        res.redirect('/backoffice');
    } else {
        req.flash('error', 'Invalid credentials');
        res.redirect('/login');
    }
});

// Logout handler
app.post('/logout', (req: Request, res: Response) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
        }
        res.redirect('/login');
    });
});

// Backoffice page
app.get('/backoffice', isAuthenticated, (_req: Request, res: Response) => {
    const data = readDataFile();
    res.render('backoffice', { products: data });
});

// Helper function to read data file
const readDataFile = (): Product[] => {
    const { dataPath } = getDataPaths();
    try {
        if (!fs.existsSync(dataPath)) {
            return [];
        }
        const data = fs.readFileSync(dataPath, 'utf8');
        try {
            return JSON.parse(data) || [];
        } catch (parseError) {
            return [];
        }
    } catch (error) {
        if (error.code === 'EACCES') {
            throw new Error('Permission denied');
        }
        return [];
    }
};

// Helper function to write data file
const writeDataFile = (data: Product[]): boolean => {
    const { dataPath, dataDir } = getDataPaths();
    try {
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing data file:', error);
        if (error.code === 'EACCES') {
            throw new Error('Permission denied');
        }
        return false;
    }
};

// Serve the index.ejs as HTML
app.get('/', (_req: Request, res: Response) => {
    try {
        console.log('Views directory:', app.get('views'));
        console.log('Current directory:', __dirname);
        console.log('Views path:', path.join(__dirname, '../views'));
        console.log('Views directory exists:', fs.existsSync(path.join(__dirname, '../views')));
        console.log('Views directory contents:', fs.readdirSync(path.join(__dirname, '../views')));
        res.render('index', { error: null });
    } catch (error) {
        console.error('Error rendering index:', error);
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        res.status(500).render('error', { 
            error: 'Internal Server Error',
            message: error instanceof Error ? error.message : 'An unexpected error occurred'
        });
    }
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).render('error', { 
        error: 'Internal Server Error',
        message: err.message || 'An unexpected error occurred'
    });
});

// Data endpoint
app.get('/data.json', (_req: Request, res: Response) => {
    try {
        const data = readDataFile();
        res.json(data);
    } catch (error) {
        console.error('Error reading data:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Add product endpoint
app.post('/api/products', (req: Request, res: Response): Response => {
    const { name, sizes, options, description } = req.body;

    if (!name || !sizes || !Array.isArray(sizes) || sizes.length === 0) {
        return res.status(400).json({ success: false, error: 'Name and at least one size with price are required' });
    }

    try {
        const data = readDataFile();
        
        // Check if product already exists
        if (data.some(p => p.name === name)) {
            return res.status(400).json({ success: false, error: 'Product already exists' });
        }

        // Validate sizes
        const validSizes = sizes.filter(size => size.size && size.price !== undefined);
        if (validSizes.length === 0) {
            return res.status(400).json({ success: false, error: 'At least one valid size with price is required' });
        }

        // Add new product
        data.push({
            name,
            sizes: validSizes.map(size => ({
                size: size.size,
                price: Number(size.price)
            })),
            options: options || [],
            description
        });

        // Save to file
        if (!writeDataFile(data)) {
            return res.status(500).json({ success: false, error: 'Failed to save product' });
        }

        return res.json({ success: true });
    } catch (error) {
        console.error('Error adding product:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Update product endpoint
app.put('/api/products/:name', (req: Request, res: Response): Response => {
    const { name } = req.params;
    const { sizes, options, description } = req.body;

    if (!name || !sizes || !Array.isArray(sizes) || sizes.length === 0) {
        return res.status(400).json({ success: false, error: 'Name and at least one size with price are required' });
    }

    try {
        const data = readDataFile();
        
        // Find the product to update
        const index = data.findIndex(p => p.name === name);
        if (index === -1) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }

        // Validate sizes
        const validSizes = sizes.filter(size => size.size && size.price !== undefined);
        if (validSizes.length === 0) {
            return res.status(400).json({ success: false, error: 'At least one valid size with price is required' });
        }

        // Update the product
        data[index] = {
            ...data[index],
            sizes: validSizes.map(size => ({
                size: size.size,
                price: Number(size.price)
            })),
            options: options || [],
            description
        };

        // Save to file
        if (!writeDataFile(data)) {
            return res.status(500).json({ success: false, error: 'Failed to save product' });
        }

        return res.json({ success: true });
    } catch (error) {
        console.error('Error updating product:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Delete product endpoint
app.delete('/api/products/:name?', isAuthenticated, (req: Request, res: Response) => {
    try {
        const { name } = req.params;
        if (!name) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }

        const data = readDataFile();
        const index = data.findIndex(product => product.name === name);
        if (index === -1) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }

        data.splice(index, 1);
        if (!writeDataFile(data)) {
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }

        return res.json({ success: true });
    } catch (error) {
        console.error('Error deleting product:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Only start the server if this file is run directly
if (require.main === module) {
    app.listen(port, () => {
        console.log(`Server is running at http://localhost:${port}`);
    });
} 