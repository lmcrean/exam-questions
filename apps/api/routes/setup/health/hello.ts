import express, { Request, Response } from 'express';

const router = express.Router();

router.get("/hello", (req: Request, res: Response) => {
  const appName = process.env.APP_DISPLAY_NAME || 'Dottie';
  res.json({ message: `Hello World from ${appName} API!` });
});

export default router;
