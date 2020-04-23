import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const transactions = await this.find();

    return transactions.reduce(
      (acc: Balance, transaction: Transaction): Balance => {
        if (transaction.type === 'income') {
          const response: Balance = {
            outcome: acc.outcome,
            income: acc.income + transaction.value * 1,
            total: acc.total + transaction.value * 1,
          };

          return response;
        }

        if (transaction.type === 'outcome') {
          const response: Balance = {
            outcome: acc.outcome + transaction.value * 1,
            income: acc.income,
            total: acc.total - transaction.value * 1,
          };
          return response;
        }

        return acc;
      },
      {
        income: 0,
        outcome: 0,
        total: 0,
      },
    );
  }
}

export default TransactionsRepository;
