import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { AppError } from '@/utils/appError';

type ValidationSchema = ZodSchema | {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
};

const validate = (schema: ValidationSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if ('safeParse' in schema) {
        // It's a direct ZodSchema, usually for body
        const result = await schema.parseAsync(req.body);
        req.body = result;
      } else {
        // It's a structured schema object
        if (schema.body) {
          req.body = await schema.body.parseAsync(req.body);
        }
        if (schema.query) {
          req.query = (await schema.query.parseAsync(req.query)) as any;
        }
        if (schema.params) {
          req.params = (await schema.params.parseAsync(req.params)) as any;
        }
      }
      next();
    } catch (error: any) {
      if (error.errors) {
        const errorMessages = error.errors.map((issue: any) => ({
          path: issue.path.join('.'),
          message: issue.message,
        }));
        return next(new AppError(`Validation error: ${JSON.stringify(errorMessages)}`, 400));
      }
      return next(new AppError('Validation failed', 400));
    }
  };
};

export default validate;
