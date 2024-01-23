import { NextFunction, Request, RequestHandler, Response } from 'express';
import { ObjectLiteral, Repository } from 'typeorm';

type RepositoryGetter<T extends ObjectLiteral> = () => Repository<T>;

export const validateEntity = <T extends ObjectLiteral>(
  key: string,
  repository: RepositoryGetter<T>,
): RequestHandler => {
  return async (
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    const { body } = request;
    const id = body[key];

    if (!id) {
      return next();
    }

    const entity = await repository().findOneBy({ id });

    if (entity) {
      return next();
    }

    response.status(422).send({ error: `Invalid value of '${key}' parameter` });
  };
};
