import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';

// ============================================================================
// TYPES
// ============================================================================
interface ValidatedData {
    body?: any;
    query?: any;
    params?: any;
}

// ============================================================================
// CONSTANTS
// ============================================================================
const HTTP_STATUS = {
    BAD_REQUEST: 400,
};

const ERROR_STATUS = 'fail';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validate request data against Zod schema
 * @param schema - Zod validation schema
 * @param data - Data to validate
 * @returns Validated data
 * @throws ZodError if validation fails
 */
async function validateData(schema: ZodSchema, data: object): Promise<any> {
    return await schema.parseAsync(data);
}

/**
 * Format Zod validation errors
 * @param error - Zod error object
 * @returns Formatted field errors
 */
function formatValidationErrors(error: ZodError): Record<string, string[]> {
    return error.flatten().fieldErrors as Record<string, string[]>;
}

/**
 * Assign validated data back to request object
 */
function assignValidatedData(req: Request, validated: ValidatedData): void {
    if (validated.body) req.body = validated.body;
    if (validated.query) req.query = validated.query;
    if (validated.params) req.params = validated.params;
}

// ============================================================================
// MIDDLEWARE EXPORT
// ============================================================================

/**
 * Validate Middleware Factory
 * 
 * Higher-order function that creates a validation middleware for Zod schemas.
 * Validates request body, query params, and route params against provided schema.
 * 
 * - Validates: body, query, params
 * - On success: Assigns clean validated data back to request
 * - On failure: Returns 400 with formatted field errors
 * 
 * @param schema - Zod schema to validate against
 * @returns Express middleware function
 * 
 * @example
 * const createUserSchema = z.object({
 *   body: z.object({ email: z.string().email() }),
 * });
 * 
 * router.post('/users', validate(createUserSchema), createUser);
 */
const validate = (schema: ZodSchema) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const dataToValidate = {
                body: req.body,
                query: req.query,
                params: req.params,
            };

            const validated = await validateData(schema, dataToValidate);
            assignValidatedData(req, validated);

            next();
        } catch (error: unknown) {
            if (error instanceof ZodError) {
                res.status(HTTP_STATUS.BAD_REQUEST).json({
                    status: ERROR_STATUS,
                    errors: formatValidationErrors(error),
                });
                return;
            }

            // Pass unexpected errors to global error handler
            next(error);
        }
    };
};

export default validate;