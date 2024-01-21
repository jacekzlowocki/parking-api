import { User } from './src/entities/User';

declare global {
  namespace Express {
    export interface Request {
      user?: User;
    }
  }
}
