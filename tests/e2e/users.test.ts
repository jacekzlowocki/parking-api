import { Server } from 'http';
import request from 'supertest';
import { server } from './server';

describe('GET /users', () => {
  let appServer: Server;

  beforeAll(async () => {
    appServer = await server();
  });

  afterAll((done) => {
    appServer.close(done);
  });

  it('should return empty list', async () => {
    const response = await request(appServer).get('/users');

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({});
  });
});
