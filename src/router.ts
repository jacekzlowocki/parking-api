import { Router } from 'express';
import HealthController from './controllers/health';
import UsersController from './controllers/users';

const router = Router();

router.get('/health', async (req, res) => {
  const controller = new HealthController();
  return res.send(controller.get());
});

router.get('/users', async (req, res) => {
  const controller = new UsersController();
  return res.send(controller.list());
});

export default router;
