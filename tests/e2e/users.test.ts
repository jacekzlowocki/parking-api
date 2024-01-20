import { Server } from 'http';
import request from 'supertest';
import { server, stopServer } from './server';

describe('GET /users', () => {
  let app: Server;

  beforeAll(async () => {
    app = await server();
  });

  afterAll(async () => {
    await stopServer(app);
  });

  it('should return empty list', async () => {
    const response = await request(app).get('/users');

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({});
  });
});
