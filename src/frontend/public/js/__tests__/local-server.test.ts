import request from 'supertest';
import path from 'path';
import fs from 'fs';
import { app } from '../local-server';

describe('Server Tests', () => {
    let agent: ReturnType<typeof request.agent>;
    const testDataDir = path.join(__dirname, '..', '..', 'data', 'test');
    const testDataPath = path.join(testDataDir, 'test-data.json');

    beforeAll(() => {
        // Set environment variable for test data path
        process.env.TEST_DATA_PATH = testDataPath;
        
        // Create test data directory if it doesn't exist
        if (!fs.existsSync(testDataDir)) {
            fs.mkdirSync(testDataDir, { recursive: true });
        }
    });

    beforeEach(async () => {
        // Reset test data before each test
        try {
            if (fs.existsSync(testDataPath)) {
                fs.unlinkSync(testDataPath);
            }
            fs.writeFileSync(testDataPath, JSON.stringify([], null, 2), { mode: 0o644 });
        } catch (error) {
            console.error('Error setting up test data:', error);
        }
        
        // Create a new agent and authenticate
        agent = request.agent(app);
        await agent
            .post('/login')
            .send({ username: 'admin', password: 'admin' });
    });

    afterAll(() => {
        // Clean up test data directory
        try {
            if (fs.existsSync(testDataPath)) {
                fs.unlinkSync(testDataPath);
            }
            if (fs.existsSync(testDataDir)) {
                fs.rmdirSync(testDataDir);
            }
        } catch (error) {
            console.error('Error cleaning up test data:', error);
        }
        // Clear environment variable
        delete process.env.TEST_DATA_PATH;
    });

    // Sample test data
    const sampleProduct = {
        name: 'Test Product',
        price: 99.99,
        description: 'A test product'
    };

    const newProduct = {
        name: 'New Product',
        price: 149.99
    };

    describe('GET /', () => {
        it('should return 200 OK', async () => {
            const response = await request(app).get('/');
            expect(response.status).toBe(200);
        });
    });

    describe('GET /login', () => {
        it('should return 200 OK', async () => {
            const response = await request(app).get('/login');
            expect(response.status).toBe(200);
        });

        it('should display flash messages', async () => {
            // Create an agent to maintain session
            const testAgent = request.agent(app);

            // First, try to login with invalid credentials to set a flash message
            await testAgent
                .post('/login')
                .send({ username: 'wrong', password: 'wrong' });

            // Then check if the flash message is displayed
            const response = await testAgent.get('/login');
            expect(response.status).toBe(200);
            expect(response.text).toContain('Invalid credentials');
        });
    });

    describe('POST /login', () => {
        it('should redirect to /backoffice with valid credentials', async () => {
            const response = await request(app)
                .post('/login')
                .send({ username: 'admin', password: 'admin' });
            expect(response.status).toBe(302);
            expect(response.header.location).toBe('/backoffice');
        });

        it('should redirect back to /login with invalid credentials', async () => {
            const response = await request(app)
                .post('/login')
                .send({ username: 'wrong', password: 'wrong' });
            expect(response.status).toBe(302);
            expect(response.header.location).toBe('/login');
        });

        it('should handle missing credentials', async () => {
            const response = await request(app)
                .post('/login')
                .send({});
            expect(response.status).toBe(302);
            expect(response.header.location).toBe('/login');
        });
    });

    describe('POST /logout', () => {
        it('should redirect to login page', async () => {
            const response = await agent.post('/logout');
            expect(response.status).toBe(302);
            expect(response.header.location).toBe('/login');
        });

        it('should destroy session', async () => {
            const response = await agent.post('/logout');
            expect(response.status).toBe(302);
            
            // Verify session is destroyed by trying to access protected route
            const backofficeResponse = await agent.get('/backoffice');
            expect(backofficeResponse.status).toBe(302);
            expect(backofficeResponse.header.location).toBe('/login');
        });
    });

    describe('GET /backoffice', () => {
        it('should redirect to /login when not authenticated', async () => {
            const response = await request(app).get('/backoffice');
            expect(response.status).toBe(302);
            expect(response.header.location).toBe('/login');
        });

        it('should return 200 when authenticated', async () => {
            const response = await agent.get('/backoffice');
            expect(response.status).toBe(200);
        });

        it('should display products when authenticated', async () => {
            // Add a product to the test data
            fs.writeFileSync(testDataPath, JSON.stringify([sampleProduct], null, 2));
            
            const response = await agent.get('/backoffice');
            expect(response.status).toBe(200);
            expect(response.text).toContain(sampleProduct.name);
            expect(response.text).toContain(sampleProduct.price.toString());
        });
    });

    describe('GET /data.json', () => {
        it('should return the products data', async () => {
            const response = await request(app).get('/data.json');
            expect(response.status).toBe(200);
            expect(response.body).toEqual([]);
        });

        it('should return empty array when no data file exists', async () => {
            fs.unlinkSync(testDataPath);
            const response = await request(app).get('/data.json');
            expect(response.status).toBe(200);
            expect(response.body).toEqual([]);
        });

        it('should handle invalid JSON in data file', async () => {
            fs.writeFileSync(testDataPath, 'invalid json');
            const response = await request(app).get('/data.json');
            expect(response.status).toBe(200);
            expect(response.body).toEqual([]);
        });
    });

    describe('POST /api/products', () => {
        beforeEach(async () => {
            // Initialize with sample product
            fs.writeFileSync(testDataPath, JSON.stringify([sampleProduct], null, 2));
        });

        it('should add a new product', async () => {
            const response = await agent
                .post('/api/products')
                .send(newProduct);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);

            // Verify the product was added
            const data = JSON.parse(fs.readFileSync(testDataPath, 'utf8'));
            expect(data).toHaveLength(2);
            expect(data).toContainEqual(sampleProduct);
            expect(data).toContainEqual(newProduct);
        });

        it('should return 400 when product name already exists', async () => {
            // Write initial data
            fs.writeFileSync(testDataPath, JSON.stringify([sampleProduct], null, 2));

            const response = await agent
                .post('/api/products')
                .send(sampleProduct);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Product already exists');

            // Verify the data file was not modified
            const data = JSON.parse(fs.readFileSync(testDataPath, 'utf8'));
            expect(data).toEqual([sampleProduct]);
        });

        it('should handle invalid price format', async () => {
            const invalidProduct = {
                name: 'Invalid Price Product',
                price: 'not a number'
            };

            const response = await agent
                .post('/api/products')
                .send(invalidProduct);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Invalid price format');
        });

        it('should return 400 when product name is missing', async () => {
            const response = await agent
                .post('/api/products')
                .send({ price: 100, description: 'No name' });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Product name is required');
        });

        it('should handle file system errors', async () => {
            // Write initial data
            fs.writeFileSync(testDataPath, JSON.stringify([sampleProduct], null, 2), { mode: 0o644 });

            // Make the data file read-only
            fs.chmodSync(testDataPath, 0o444);

            const response = await agent
                .post('/api/products')
                .send(newProduct);

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Internal server error');

            // Restore file permissions
            fs.chmodSync(testDataPath, 0o644);
        });
    });

    describe('DELETE /api/products/:name', () => {
        beforeEach(async () => {
            // Initialize with sample product
            try {
                if (fs.existsSync(testDataPath)) {
                    fs.unlinkSync(testDataPath);
                }
                fs.writeFileSync(testDataPath, JSON.stringify([sampleProduct], null, 2), { mode: 0o644 });
            } catch (error) {
                console.error('Error setting up test data:', error);
            }
        });

        it('should delete a product', async () => {
            const response = await agent
                .delete(`/api/products/${sampleProduct.name}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);

            // Verify the product was deleted
            const data = JSON.parse(fs.readFileSync(testDataPath, 'utf8'));
            expect(data).toHaveLength(0);
        });

        it('should return 404 when product not found', async () => {
            const response = await agent
                .delete('/api/products/nonexistent');

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Product not found');

            // Verify the data file was not modified
            const data = JSON.parse(fs.readFileSync(testDataPath, 'utf8'));
            expect(data).toHaveLength(1);
            expect(data).toContainEqual(sampleProduct);
        });

        it('should return 404 when product name is missing', async () => {
            const response = await agent
                .delete('/api/products/');

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Product not found');
        });

        it('should handle file system errors', async () => {
            // Make the data file read-only
            fs.chmodSync(testDataPath, 0o444);

            const response = await agent
                .delete(`/api/products/${sampleProduct.name}`);

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Internal server error');

            // Restore file permissions
            fs.chmodSync(testDataPath, 0o644);
        });
    });

    describe('Error handling', () => {
        it('should handle invalid JSON in request body', async () => {
            const response = await agent
                .post('/api/products')
                .set('Content-Type', 'application/json')
                .send('invalid json');

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Invalid JSON');
        });

        it('should handle server errors gracefully', async () => {
            // Make the data file read-only
            fs.chmodSync(testDataPath, 0o444);

            const response = await agent
                .post('/api/products')
                .send(newProduct);

            expect(response.status).toBe(500);
            expect(response.body.error).toBe('Internal server error');

            // Restore file permissions
            fs.chmodSync(testDataPath, 0o644);
        });
    });
});