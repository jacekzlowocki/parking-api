import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../contracts/AuthenticatedRequest';
import { UserRole } from '../entities/User';

export const validateUserId = async (
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  const { user, body } = request;

  if (!body.userId || body.userId === user.id || user.role === UserRole.Admin) {
    return next();
  }

  response.status(422).send({ error: `Illegal value of 'userId' parameter` });
};
