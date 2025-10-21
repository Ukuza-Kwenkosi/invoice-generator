import { APIGatewayProxyHandlerV2 } from 'aws-lambda';

const json = (c: number, b: any) => ({
  statusCode: c,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(b),
});

export const login: APIGatewayProxyHandlerV2 = async (event) => {
  const { username, password } = JSON.parse(event.body || '{}');
  if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
    return json(200, { success: true, data: { token: process.env.ADMIN_PASSWORD } });
  }
  return json(401, { success: false, error: 'Invalid credentials' });
};

export const logout: APIGatewayProxyHandlerV2 = async () => json(200, { success: true });



