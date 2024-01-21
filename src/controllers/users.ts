import { Get, Header, Route, Security } from 'tsoa';
import { User, UserRole } from '../entities/User';
import { getUsers } from '../repositories/users';

@Route('users')
export class UsersController {
  @Header('Authorization')
  @Security('token', [UserRole.Admin])
  @Get('/')
  public async list(): Promise<User[]> {
    return getUsers();
  }
}
