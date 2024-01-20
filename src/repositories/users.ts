import { Repository } from 'typeorm';
import { appDataSource } from '../dataSource';
import { User } from '../entities/User';

export const userRepository = (): Repository<User> =>
  appDataSource().getRepository(User);

export const getUsers = (): Promise<User[]> => {
  return userRepository().find();
};
