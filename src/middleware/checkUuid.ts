import { Request, Response, NextFunction } from 'express';
import { isUuid } from 'uuidv4';
import AppError from '../errors/AppError';

export default function checkUuid(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  const { id } = request.params;

  if (!id || !isUuid(id)) {
    throw new AppError('Inválid or missing id', 403);
  }

  next();
}
