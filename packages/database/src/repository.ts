// Services depend on this interface only, so the DB engine can be swapped (e.g. Cloud SQL) without touching business logic.
export interface FindOptions {
  limit?: number;
  skip?: number;
  sort?: Record<string, 1 | -1>;
}

export interface Repository<T> {
  findById(id: string): Promise<T | null>;
  findMany(filter?: Record<string, unknown>, opts?: FindOptions): Promise<T[]>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
}
