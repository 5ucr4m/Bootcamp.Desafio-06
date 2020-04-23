import { getRepository, In } from 'typeorm';
import csvParse from 'csv-parse';
import fs from 'fs';
import path from 'path';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface ParseTransaction {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

interface PreCategorySave {
  title: string;
}

class ImportTransactionsService {
  private async readFile(pathfile: string): Promise<ParseTransaction[]> {
    const readCSVStream = fs.createReadStream(pathfile);

    const parseStream = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });

    const parseCSV = readCSVStream.pipe(parseStream);
    const transactions: ParseTransaction[] = [];

    parseCSV.on('data', async line => {
      const [title, type, value, category] = line;
      const item = { title, type, value, category };
      transactions.push(item as ParseTransaction);
    });

    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });

    return transactions;
  }

  private async createCategory(arr: PreCategorySave[]): Promise<Category[]> {
    const categoryRepository = getRepository(Category);

    const cadastredCategories = await categoryRepository.find({
      where: {
        title: In(arr.map(item => item.title)),
      },
    });

    const newCategories = arr.reduce(
      (newArray: PreCategorySave[], category) => {
        // Verifica se já existe no array reduzido ( remover duplicados )
        if (newArray.find(element => element.title === category.title))
          return newArray;
        // Procura nos arrays de categorias já cadastradas
        return cadastredCategories.find(
          element => category.title === element.title,
        )
          ? newArray
          : [...newArray, category];
      },
      [],
    );

    const preSaveCategories = await categoryRepository.create(newCategories);
    const categories = await categoryRepository.save(preSaveCategories);
    return [...cadastredCategories, ...categories];
  }

  async execute(arq: string): Promise<Transaction[]> {
    const file = path.resolve(__dirname, '..', '..', 'tmp', arq);
    const csvTransactions = await this.readFile(file);
    const transactionRepository = getRepository(Transaction);

    const csvCategories = csvTransactions.map(item => ({
      title: item.category,
    }));

    const categories = await this.createCategory(csvCategories);

    const preTransactions: Transaction[] = [];

    csvTransactions.forEach(transaction => {
      const findedCategory = categories.find(
        category => category.title === transaction.category,
      );

      if (findedCategory)
        preTransactions.push(
          transactionRepository.create({
            title: transaction.title,
            type: transaction.type,
            value: transaction.value,
            category_id: findedCategory.id,
          }),
        );
    });

    const transactions = await transactionRepository.save(preTransactions);
    return transactions;
  }
}

export default ImportTransactionsService;
