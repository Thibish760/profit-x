import { v4 as uuidv4 } from 'uuid';
import { Router } from 'express';
import { z } from 'zod';
import { createUser, findUserByCredentials } from '../db/store';
import { createAuthToken } from '../security/token';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const authRouter = Router();

authRouter.post('/auth/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload', issues: parsed.error.flatten() });
  }

  try {
    const normalizedEmail = parsed.data.email.trim().toLowerCase();

    const newUser = {
      id: uuidv4(),
      email: normalizedEmail,
      password: parsed.data.password,
      role: 'staff' as const,
    };

    const created = await createUser(newUser);
    if (!created) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    const token = createAuthToken(newUser.id);

    return res.status(201).json({
      token,
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

authRouter.post('/auth/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload', issues: parsed.error.flatten() });
  }

  try {
    const user = await findUserByCredentials(parsed.data.email.trim().toLowerCase(), parsed.data.password);

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = createAuthToken(user.id);

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error logging in user:', error);
    return res.status(500).json({
      message: 'Failed to login user',
      detail: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
