import { Router } from 'express';

export const portfolioRouter = Router();

portfolioRouter.get('/prices', (_req, res) => {
  res.json({ placeholder: true });
});
