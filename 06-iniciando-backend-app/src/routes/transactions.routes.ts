import { Router } from 'express';
import { getCustomRepository } from 'typeorm';

import multer from 'multer';
import uploadConfig from '../config/upload';

import TransactionsRepository from '../repositories/TransactionsRepository';

import CreateTransactionService from '../services/CreateTransactionService';
import DeleteTransactionService from '../services/DeleteTransactionService';
import ImportTransactionsService from '../services/ImportTransactionsService';

const transactionsRouter = Router();
const uploadFile = multer(uploadConfig);
const loadTransactionMiddleware = uploadFile.single('file');

transactionsRouter.get('/', async (request, response) => {
  const transactionRepository = await getCustomRepository(
    TransactionsRepository,
  );

  const transactions = await transactionRepository.find({
    relations: ['category'],
  });

  const balance = await transactionRepository.getBalance();

  return response.json({
    transactions,
    balance,
  });
});

transactionsRouter.post('/', async (request, response) => {
  const { title, type, value, category } = request.body;

  const createTransaction = new CreateTransactionService();

  const transaction = await createTransaction.execute({
    title,
    type,
    value,
    category,
  });

  return response.status(201).json(transaction);
});

transactionsRouter.delete('/:id', async (request, response) => {
  const { id } = request.params;

  const deleteTransaction = new DeleteTransactionService();

  await deleteTransaction.execute({ id });

  return response.status(204).send();
});

transactionsRouter.post(
  '/import',
  loadTransactionMiddleware,
  async (request, response) => {
    const {
      file: { path: filePath },
    } = request;

    const importTransactions = new ImportTransactionsService();

    const transactions = await importTransactions.execute({ filePath });

    return response.status(201).json(transactions);
  },
);

export default transactionsRouter;
