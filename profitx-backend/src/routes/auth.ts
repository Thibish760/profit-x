import { createHmac } from 'node:crypto';
import { v4 as uuidv4 } from 'uuid';
import { Router } from 'express';
import { z } from 'zod';
import { config } from '../config';
import { readData, writeData } from '../db/store';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const authRouter = Router();

authRouter.post('/auth/register', (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload', issues: parsed.error.flatten() });
  }

  try {
    const normalizedEmail = parsed.data.email.trim().toLowerCase();
    const data = readData();
    const existing = data.users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (existing) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    const newUser = {
      id: uuidv4(),
      email: normalizedEmail,
      password: parsed.data.password,
      role: 'staff' as const,
    };

    data.users.push(newUser);
    writeData(data);

    return res.status(201).json({
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error('Error registering user:', error);
    return res.status(500).json({
      message: 'Failed to register user',
      detail: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

authRouter.post('/auth/login', (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload', issues: parsed.error.flatten() });
  }

  const data = readData();
  const user = data.users.find(
    (u) => u.email.toLowerCase() === parsed.data.email.toLowerCase() && u.password === parsed.data.password,
  );

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = createHmac('sha256', config.appSecret)
    .update(`${user.id}:${Date.now()}`)
    .digest('hex');

  return res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
  });
});
