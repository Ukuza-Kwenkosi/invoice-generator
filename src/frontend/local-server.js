const express = require('express');
const path = require('path');
const fs = require('fs');
const ejs = require('ejs');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const flash = require('connect-flash');

const app = express();
const port = 3000;

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.static(path.join(__dirname, 'public'), {
    setHeaders: (res, path) => {
        if (path.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        } else if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        } else if (path.endsWith('.html')) {
            res.setHeader('Content-Type', 'text/html');
        }
    }
}));

// Serve templates directory
app.use('/templates', express.static(path.join(__dirname, 'public', 'templates'), {
    setHeaders: (res, path) => {
        if (path.endsWith('.html')) {
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
const isAuthenticated = (req, res, next) => {
    if (req.session.authenticated) {
        next();
    } else {
        res.redirect('/login');
    }
};

// Login page
app.get('/login', (req, res) => {
    res.render('login', { messages: req.flash() });
});

// Login handler
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    // In a real application, you would validate against a database
    // For demo purposes, we'll use a hardcoded credential
    if (username === 'admin' && password === 'admin123') {
        req.session.authenticated = true;
        res.redirect('/backoffice');
    } else {
        req.flash('error', 'Invalid credentials');
        res.redirect('/login');
    }
});

// Logout handler
app.post('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// Backoffice page
app.get('/backoffice', isAuthenticated, (req, res) => {
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'public', 'data.json'), 'utf8'));
    res.render('backoffice', { products: data });
});

// API endpoints for product management
app.post('/api/products', isAuthenticated, (req, res) => {
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'public', 'data.json'), 'utf8'));
    const newProduct = req.body;
    
    // Handle options string to array conversion
    if (newProduct.options) {
        newProduct.options = newProduct.options.split(',').map(opt => opt.trim());
    }
    
    // Handle price conversion
    if (newProduct.price) {
        newProduct.price = Number(newProduct.price);
    }
    
    data.push(newProduct);
    fs.writeFileSync(path.join(__dirname, 'public', 'data.json'), JSON.stringify(data, null, 4));
    res.json({ success: true });
});

app.delete('/api/products/:name', isAuthenticated, (req, res) => {
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'public', 'data.json'), 'utf8'));
    const filteredData = data.filter(product => product.name !== req.params.name);
    fs.writeFileSync(path.join(__dirname, 'public', 'data.json'), JSON.stringify(filteredData, null, 4));
    res.json({ success: true });
});

// Serve the index.ejs as HTML
app.get('/', (req, res) => {
    res.render('index');
});

// Data endpoint for the dropdown items
app.get('/data.json', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'data.json'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Try to find an available port if 3000 is in use
app.listen(port, () => {
    console.log(`Local development server running at http://localhost:${port}`);
    console.log('Press Ctrl+C to stop');
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.log(`Port ${port} is already in use, trying port ${port + 1}`);
        app.listen(port + 1, () => {
            console.log(`Local development server running at http://localhost:${port + 1}`);
            console.log('Press Ctrl+C to stop');
        });
    } else {
        console.error('Error starting server:', err);
    }
}); 