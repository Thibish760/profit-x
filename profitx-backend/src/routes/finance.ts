import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { readData, writeData } from '../db/store';
import { FinanceVendor } from '../types';

const paymentSchema = z.object({
  amount: z.number().positive(),
  month: z.string().min(3),
  year: z.string().min(4),
  paidOn: z.string().optional(),
});

const vendorSchema = z.object({
  name: z.string().trim().min(1),
  loanDate: z.string().trim().min(1),
  loanAmount: z.number().nonnegative(),
});

const patchVendorSchema = z.object({
  name: z.string().trim().min(1).optional(),
  loanDate: z.string().trim().min(1).optional(),
  loanAmount: z.number().nonnegative().optional(),
});

export const financeRouter = Router();

financeRouter.get('/finance/vendors', (_req, res) => {
  const data = readData();
  res.json(data.finance.vendors);
});

financeRouter.get('/finance/summary', (_req, res) => {
  const data = readData();
  const vendors = data.finance.vendors;
  const totalLoan = vendors.reduce((sum, v) => sum + v.loanAmount, 0);
  const totalPaid = vendors.reduce(
    (sum, v) => sum + v.payments.reduce((acc, payment) => acc + payment.amount, 0),
    0,
  );

  res.json({
    totalLoan,
    totalPaid,
    remaining: Math.max(totalLoan - totalPaid, 0),
    vendorCount: vendors.length,
  });
});

financeRouter.post('/finance/vendors', (req, res) => {
  const parsed = vendorSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload', issues: parsed.error.flatten() });
  }

  try {
    const data = readData();
    const vendor: FinanceVendor = {
      id: uuidv4(),
      name: parsed.data.name,
      loanDate: parsed.data.loanDate,
      loanAmount: parsed.data.loanAmount,
      payments: [],
    };

    data.finance.vendors.push(vendor);
    writeData(data);

    return res.status(201).json(vendor);
  } catch (error) {
    console.error('Error creating vendor:', error);
    return res.status(500).json({
      message: 'Failed to create vendor',
      detail: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

financeRouter.patch('/finance/vendors/:id', (req, res) => {
  const parsed = patchVendorSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload', issues: parsed.error.flatten() });
  }

  try {
    const data = readData();
    const vendor = data.finance.vendors.find((v) => v.id === req.params.id);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    if (parsed.data.name !== undefined) vendor.name = parsed.data.name;
    if (parsed.data.loanDate !== undefined) vendor.loanDate = parsed.data.loanDate;
    if (parsed.data.loanAmount !== undefined) vendor.loanAmount = parsed.data.loanAmount;

    writeData(data);
    return res.json(vendor);
  } catch (error) {
    console.error('Error updating vendor:', error);
    return res.status(500).json({
      message: 'Failed to update vendor',
      detail: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

financeRouter.post('/finance/vendors/:id/payments', (req, res) => {
  const parsed = paymentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload', issues: parsed.error.flatten() });
  }

  try {
    const data = readData();
    const vendor = data.finance.vendors.find((v) => v.id === req.params.id);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    const payment = {
      amount: parsed.data.amount,
      month: parsed.data.month,
      year: parsed.data.year,
      paidOn: parsed.data.paidOn ?? new Date().toISOString().slice(0, 10),
      timestamp: Date.now(),
    };

    vendor.payments.push(payment);
    writeData(data);

    return res.status(201).json(payment);
  } catch (error) {
    console.error('Error adding payment:', error);
    return res.status(500).json({
      message: 'Failed to save payment',
      detail: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
