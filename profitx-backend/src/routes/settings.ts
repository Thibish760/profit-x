import { Router } from 'express';
import { z } from 'zod';
import { readData, writeData } from '../db/store';

const settingsSchema = z.object({
  shopName: z.string().trim().min(1),
  ownerName: z.string().trim().min(1).optional(),
});

export const settingsRouter = Router();

settingsRouter.get('/settings/shop', (_req, res) => {
  const data = readData();
  res.json(data.settings);
});

settingsRouter.put('/settings/shop', (req, res) => {
  const parsed = settingsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload', issues: parsed.error.flatten() });
  }

  try {
    const data = readData();
    data.settings.shopName = parsed.data.shopName;
    if (parsed.data.ownerName) {
      data.settings.ownerName = parsed.data.ownerName;
    }
    writeData(data);

    return res.json(data.settings);
  } catch (error) {
    console.error('Error updating settings:', error);
    return res.status(500).json({
      message: 'Failed to update settings',
      detail: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
