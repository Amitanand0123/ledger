import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { ValidationError } from '../utils/ApiError.js';

/**
 * Middleware to validate request data using Zod schemas
 *
 * @param schema - Zod schema to validate against
 * @returns Express middleware function
 *
 * @example
 * router.post('/jobs', validate(createJobSchema), createJobController);
 */
export const validate = (schema: AnyZodObject) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                // Format Zod errors into a readable message
                const errorMessages = error.errors.map((err) => {
                    const path = err.path.join('.');
                    return `${path}: ${err.message}`;
                });

                return next(new ValidationError(errorMessages.join(', ')));
            }
            next(error);
        }
    };
};
