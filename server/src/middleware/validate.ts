import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

export function validate(schema: {
  body?: z.ZodSchema<any>;
  params?: z.ZodSchema<any>;
  query?: z.ZodSchema<any>;
}) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schema.params) {
        req.params = await schema.params.parseAsync(req.params);
      }
      if (schema.query) {
        req.query = await schema.query.parseAsync(req.query);
      }
      if (schema.body) {
        req.body = await schema.body.parseAsync(req.body);
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const issues = err.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        }));
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: issues.map((i) => i.message).join(', '),
            details: issues,
          },
        });
        return;
      }
      next(err);
    }
  };
}

// Schemas
export const createRoomSchema = {
  body: z.object({
    displayName: z
      .string({ required_error: 'Display name is required' })
      .trim()
      .min(1, 'Display name cannot be empty')
      .max(30, 'Display name cannot exceed 30 characters'),
  }),
};

export const joinRoomSchema = {
  params: z.object({
    code: z
      .string({ required_error: 'Room code is required' })
      .trim()
      .min(4, 'Room code must be at least 4 characters')
      .max(10, 'Room code cannot exceed 10 characters')
      .regex(/^[A-Za-z0-9]+$/, 'Room code must be alphanumeric')
      .transform((c) => c.toUpperCase()),
  }),
  body: z.object({
    displayName: z
      .string({ required_error: 'Display name is required' })
      .trim()
      .min(1, 'Display name cannot be empty')
      .max(30, 'Display name cannot exceed 30 characters'),
  }),
};

export const roomCodeParamSchema = {
  params: z.object({
    code: z
      .string({ required_error: 'Room code is required' })
      .trim()
      .min(1, 'Room code cannot be empty')
      .transform((c) => c.toUpperCase()),
  }),
};

export const updateSettingsSchema = {
  params: z.object({
    code: z.string().trim().min(1),
  }),
  body: z.object({
    settings: z.object({
      imposterCount: z.number().int().min(1).max(5).optional(),
      difficulty: z.enum(['Easy', 'Medium', 'Hard', 'Any']).optional(),
      category: z.string().trim().max(50).optional(),
      wordLanguage: z.enum(['en', 'hi-Latn', 'mixed', 'Any']).optional(),
    }),
  }),
};

export const renamePlayerSchema = {
  params: z.object({
    code: z.string().trim().min(1),
  }),
  body: z.object({
    displayName: z
      .string({ required_error: 'Display name is required' })
      .trim()
      .min(1, 'Display name cannot be empty')
      .max(30, 'Display name cannot exceed 30 characters'),
  }),
};

export const gameParamsSchema = {
  params: z.object({
    code: z.string().trim().min(1),
    gameId: z.string().trim().min(1, 'Game ID is required'),
  }),
};
