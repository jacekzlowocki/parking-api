import { Request } from 'express';
import { User } from '../entities/User';
import { findUserByToken } from '../repositories/users';

export const expressAuthentication = async (
  request: Request,
  securityName: string,
  scopes?: string[],
): Promise<User> => {
  if (securityName !== 'token') {
    throw new Error('Invalid securityName value');
  }

  const { authorization } = request.headers;

  if (authorization) {
    const user = await findUserByToken(authorization);

    if (isAuthorized(user, scopes)) {
      return user!;
    }
  }

  return Promise.reject({});
};

function isAuthorized(user: User | null, scopes?: string[]): boolean {
  return Boolean(
    user && (!scopes || scopes?.length === 0 || scopes?.includes(user.role)),
  );
}
