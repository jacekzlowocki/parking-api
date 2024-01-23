import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../contracts/ApiError';

export const errorHandler = (
  error: unknown | { status: string },
  request: Request,
  response: Response,
  next: NextFunction,
): void => {
  const { status } = error as { status: number };

  if (error instanceof ApiError) {
    response.status(error.statusCode).send({ error: error.message });
  } else if (error instanceof Error) {
    response.status(500).send({ error: error.message });
  } else if (status) {
    response.status(status).send({ error: mapMessage(status) });
  } else {
    console.error('Uncaught error', error);
    response.status(500).send('Internal Server Error');
  }

  next();
};

function mapMessage(status: number): string {
  const map: { [status: number]: string } = { 401: 'Unauthorized' };

  return map[status] || '';
}
