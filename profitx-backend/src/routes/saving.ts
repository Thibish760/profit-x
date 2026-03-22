import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { readData, writeData } from '../db/store';
import { SavingCard } from '../types';

const depositSchema = z.object({
  amount: z.number().positive(),
  month: z.string().min(3),
  year: z.string().min(4),
  paidOn: z.string().optional(),
});

const savingCardSchema = z.object({
  name: z.string().trim().min(1),
  startedOn: z.string().trim().min(1),
  initialAmount: z.number().nonnegative(),
});

const patchSavingCardSchema = z.object({
  name: z.string().trim().min(1).optional(),
  startedOn: z.string().trim().min(1).optional(),
  initialAmount: z.number().nonnegative().optional(),
});

export const savingRouter = Router();

savingRouter.get('/saving/cards', (_req, res) => {
  const data = readData();
  res.json(data.saving.cards);
});

savingRouter.get('/saving/summary', (_req, res) => {
  const data = readData();
  const cards = data.saving.cards;
  const initial = cards.reduce((sum, c) => sum + c.initialAmount, 0);
  const deposits = cards.reduce(
    (sum, c) => sum + c.deposits.reduce((acc, payment) => acc + payment.amount, 0),
    0,
  );

  res.json({
    initial,
    deposits,
    totalSaved: initial + deposits,
    cardCount: cards.length,
  });
});

savingRouter.post('/saving/cards', (req, res) => {
  const parsed = savingCardSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload', issues: parsed.error.flatten() });
  }

  try {
    const data = readData();
    const card: SavingCard = {
      id: uuidv4(),
      name: parsed.data.name,
      startedOn: parsed.data.startedOn,
      initialAmount: parsed.data.initialAmount,
      deposits: [],
    };

    data.saving.cards.push(card);
    writeData(data);

    return res.status(201).json(card);
  } catch (error) {
    console.error('Error creating saving card:', error);
    return res.status(500).json({ 
      message: 'Failed to create saving card',
      detail: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

savingRouter.patch('/saving/cards/:id', (req, res) => {
  const parsed = patchSavingCardSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload', issues: parsed.error.flatten() });
  }

  try {
    const data = readData();
    const card = data.saving.cards.find((c) => c.id === req.params.id);
    if (!card) {
      return res.status(404).json({ message: 'Saving card not found' });
    }

    if (parsed.data.name !== undefined) card.name = parsed.data.name;
    if (parsed.data.startedOn !== undefined) card.startedOn = parsed.data.startedOn;
    if (parsed.data.initialAmount !== undefined) card.initialAmount = parsed.data.initialAmount;

    writeData(data);
    return res.json(card);
  } catch (error) {
    console.error('Error updating saving card:', error);
    return res.status(500).json({
      message: 'Failed to update saving card',
      detail: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

savingRouter.post('/saving/cards/:id/deposits', (req, res) => {
  const parsed = depositSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload', issues: parsed.error.flatten() });
  }

  try {
    const data = readData();
    const card = data.saving.cards.find((c) => c.id === req.params.id);
    if (!card) {
      return res.status(404).json({ message: 'Saving card not found' });
    }

    const deposit = {
      amount: parsed.data.amount,
      month: parsed.data.month,
      year: parsed.data.year,
      paidOn: parsed.data.paidOn ?? new Date().toISOString().slice(0, 10),
      timestamp: Date.now(),
    };

    card.deposits.push(deposit);
    writeData(data);

    return res.status(201).json(deposit);
  } catch (error) {
    console.error('Error adding deposit to saving card:', error);
    return res.status(500).json({
      message: 'Failed to save deposit',
      detail: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
