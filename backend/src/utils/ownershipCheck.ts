import { Model, Types } from 'mongoose';

export class NotFoundError extends Error {
  statusCode: number;
  code: string;

  constructor(message = 'Resource not found') {
    super(message);
    this.statusCode = 404;
    this.code = 'NOT_FOUND';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Asserts that a resource exists and belongs to the specified organization and (optionally) user.
 * Always throws 404 (never 403) to prevent resource existence enumeration.
 */
export async function assertOwnership<T>(
  ModelClass: Model<T>,
  resourceId: string,
  orgId: string,
  userId?: string
): Promise<T> {
  if (!Types.ObjectId.isValid(resourceId)) {
    throw new NotFoundError();
  }

  const query: Record<string, any> = {
    _id: new Types.ObjectId(resourceId),
    orgId: new Types.ObjectId(orgId),
    isDeleted: { $ne: true },
  };

  if (userId) {
    query.userId = new Types.ObjectId(userId);
  }

  const doc = await ModelClass.findOne(query);
  if (!doc) {
    throw new NotFoundError();
  }

  return doc;
}
