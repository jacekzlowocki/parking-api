import { Get, Route } from 'tsoa';
import { User } from '../entities/User';
import { getUsers } from '../repositories/users';

@Route('users')
export default class UsersController {
  @Get('/')
  public list(): Promise<User[]> {
    return getUsers();
  }
}
