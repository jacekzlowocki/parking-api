import { Request } from 'express';
import { User } from '../entities/User';

export interface AuthenticatedRequest extends Request {
  user: User;
}
