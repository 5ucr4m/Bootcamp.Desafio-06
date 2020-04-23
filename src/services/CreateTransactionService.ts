import { getRepository, getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import TransactionRepository from '../repositories/TransactionsRepository';

import Category from '../models/Category';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const categoryRepository = getRepository(Category);
    const transactionRepository = getCustomRepository(TransactionRepository);

    const balance = await transactionRepository.getBalance();

    if (type === 'outcome' && balance.total < value)
      throw new AppError('Do you not have founds!!', 400);

    let findedCategory = await categoryRepository.findOne({
      where: {
        title: category,
      },
    });

    if (!findedCategory) {
      findedCategory = categoryRepository.create({ title: category });
      await categoryRepository.save(findedCategory);
    }

    const { id } = findedCategory;

    const transaction = transactionRepository.create({
      title,
      value,
      type,
      category_id: id,
    });

    await transactionRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
