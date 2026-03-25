import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { config } from './config';
import { readData } from './db/store';
import { requireAuth } from './middleware/auth';
import { errorHandler } from './middleware/error-handler';
import { notFound } from './middleware/not-found';
import { authRouter } from './routes/auth';
import { dataRouter } from './routes/data';
import { financeRouter } from './routes/finance';
import { healthRouter } from './routes/health';
import { savingRouter } from './routes/saving';
import { settingsRouter } from './routes/settings';

const app = express();

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({
    service: 'profitx-backend',
    message: 'Backend is running',
    docs: '/api/health',
  });
});

app.use('/api', healthRouter);
app.use('/api', authRouter);
app.use('/api', requireAuth, settingsRouter);
app.use('/api', requireAuth, dataRouter);
app.use('/api', requireAuth, financeRouter);
app.use('/api', requireAuth, savingRouter);

app.use(notFound);
app.use(errorHandler);

async function startServer(): Promise<void> {
  await readData();

  app.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(`ProfitX backend listening on http://localhost:${config.port}`);
  });
}

startServer().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start backend:', error);
  process.exit(1);
});
