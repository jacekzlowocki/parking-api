import { Server } from 'http';
import request from 'supertest';
import { UserRole } from '../../src/entities/User';
import { createUser, userRepository } from '../../src/repositories/users';
import { server, stopServer } from './server';

describe('GET /users', () => {
  let app: Server;
  const tokenAdmin = 'foo';
  const tokenStandard = 'baz';

  beforeAll(async () => {
    app = await server();
    await userRepository().clear();

    await createUser({
      email: 'test1@',
      firstName: 'X',
      lastName: 'X',
      role: UserRole.Standard,
      token: tokenStandard,
    });

    await createUser({
      email: 'test2@',
      firstName: 'Y',
      lastName: 'Y',
      role: UserRole.Admin,
      token: tokenAdmin,
    });
  });

  afterAll(async () => {
    await stopServer(app);
  });

  it('returns 401 Unauthorized', async () => {
    const response = await request(app).get('/users');

    expect(response.statusCode).toBe(401);
  });

  it('returns 401 Unauthorized with standard user token', async () => {
    const response = await request(app)
      .get('/users')
      .set({ Authorization: tokenStandard });

    expect(response.statusCode).toBe(401);
  });

  it('returns 200 with data for admin user token', async () => {
    const response = await request(app)
      .get('/users')
      .set({ Authorization: tokenAdmin });

    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(2);
  });
});
