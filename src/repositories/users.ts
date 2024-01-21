import { Repository } from 'typeorm';
import { appDataSource } from '../dataSource';
import { User } from '../entities/User';

export const userRepository = (): Repository<User> =>
  appDataSource().getRepository(User);

export const getUser = (id: number): Promise<User | null> => {
  return userRepository().findOneBy({ id });
};

export const getUsers = (): Promise<User[]> => {
  return userRepository().find();
};

export const findUserByToken = (token: string): Promise<User | null> => {
  return userRepository().findOneBy({ token });
};

export const createUser = async (data: Partial<User>): Promise<User> => {
  const user = userRepository().create(data);
  await userRepository().save(user);

  return user;
};
