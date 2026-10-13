
import type { Request, Response, NextFunction, RequestHandler } from "express";

type AsyncController<TReq extends Request = Request> = (
  req: TReq,
  res: Response,
  next: NextFunction
) => Promise<unknown>;

export const asyncHandler = <TReq extends Request = Request>(
  fn: AsyncController<TReq>
): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req as TReq, res, next)).catch(next);
  };
};
