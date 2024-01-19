import { Router } from 'express';
import HealthController from './controllers/health';

const router = Router();

router.get('/health', async (req, res) => {
  const controller = new HealthController();
  return res.send(controller.get());
});

export default router;
