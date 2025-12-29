import { Request, Response, NextFunction } from "express";
import { ZodError, ZodSchema } from "zod";

/**
 * Universal Zod 4.2.1 Validator
 * Fixes: 'parsed' is of type 'unknown' (ts18046)
 */
const validate = (schema: ZodSchema) =>
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            // 1. Perform validation
            const result = await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });

            // 2. Type Assertion: Tell TS that 'result' has our expected structure
            const parsed = result as { body: any; query: any; params: any };

            // 3. Re-assign clean data to Request
            req.body = parsed.body;
            req.query = parsed.query;
            req.params = parsed.params;

            return next();
        } catch (error: unknown) {
            if (error instanceof ZodError) {
                return res.status(400).json({
                    status: "fail",
                    errors: error.flatten().fieldErrors,
                });
            }
            return next(error);
        }
    };

export default validate;