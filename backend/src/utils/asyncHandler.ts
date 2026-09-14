import { Request, Response, NextFunction } from 'express';

/**
 * Wraps an async express handler to catch errors and pass them to the next middleware.
 */
export const asyncHandler = <T extends Request = Request>(
  fn: (req: T, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req as T, res, next).catch(next);
  };
};
