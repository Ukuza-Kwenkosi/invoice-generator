import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { DatabaseFactory } from '../data/database.factory';

const json = (c: number, b: any) => ({
  statusCode: c,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(b),
});

export const getProducts: APIGatewayProxyHandlerV2 = async () => {
  try {
    const db = DatabaseFactory.getDatabase();
    const products = await db.getAllProducts();
    return json(200, products);
  } catch (error: any) {
    console.error('Error getting products:', error);
    return json(500, { error: 'Failed to get products', details: error.message });
  }
};

export const getProduct: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const id = event.pathParameters?.id as string;
    const db = DatabaseFactory.getDatabase();
    const p = await db.getProduct(id);
    return p ? json(200, p) : json(404, { success: false, error: 'Product not found' });
  } catch (error: any) {
    console.error('Error getting product:', error);
    return json(500, { error: 'Failed to get product', details: error.message });
  }
};

export const createProduct: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const data = JSON.parse(event.body || '{}');
    if (!data?.name || !Array.isArray(data?.sizes) || data.sizes.length === 0) {
      return json(400, { error: 'Invalid product payload' });
    }
    const db = DatabaseFactory.getDatabase();
    await db.addProduct(data);
    return json(200, { success: true });
  } catch (error: any) {
    console.error('Error creating product:', error);
    return json(500, { error: 'Failed to create product', details: error.message });
  }
};

export const updateProduct: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const id = event.pathParameters?.id as string;
    const data = JSON.parse(event.body || '{}');
    const db = DatabaseFactory.getDatabase();
    await db.updateProduct(id, data);
    return json(200, { success: true });
  } catch (error: any) {
    console.error('Error updating product:', error);
    return json(500, { error: 'Failed to update product', details: error.message });
  }
};

export const deleteProduct: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const id = event.pathParameters?.id as string;
    const db = DatabaseFactory.getDatabase();
    await db.deleteProduct(id);
    return json(200, { success: true });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    return json(500, { error: 'Failed to delete product', details: error.message });
  }
};


