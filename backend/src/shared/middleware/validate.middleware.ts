import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
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
      if (error instanceof ZodError) {
        const errorMessages = error.issues.map((issue: any) => `${issue.path.join('.')}: ${issue.message}`).join(', ');
        return next(new AppError(`Validation error: ${errorMessages}`, 400));
      }

      // Handle edge cases where error.message is a stringified JSON array of errors
      try {
        if (error.message && error.message.startsWith('[')) {
          const parsed = JSON.parse(error.message);
          if (Array.isArray(parsed)) {
            const messages = parsed.map((e: any) => {
              const path = e.path ? (Array.isArray(e.path) ? e.path.join('.') : e.path) : 'unknown';
              return `${path}: ${e.message}`;
            }).join(', ');
            return next(new AppError(`Validation error: ${messages}`, 400));
          }
        }
      } catch (e) {
        // Ignore JSON parse errors and fall through
      }

      if (error.errors) {
        const errorMessages = error.errors.map((issue: any) => `${issue.path.join('.')}: ${issue.message}`).join(', ');
        return next(new AppError(`Validation error: ${errorMessages}`, 400));
      }

      return next(new AppError(`Validation failed: ${error.message}`, 400));
    }
  };
};

export default validate;
