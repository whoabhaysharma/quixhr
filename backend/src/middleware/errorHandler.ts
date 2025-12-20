import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error(err.message);

  if (err.message === 'Validation error') {
    res.status(400).json({
      message: 'Validation failed',
      error: err.message,
    });
    return;
  }

  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Unknown error',
  });
};
