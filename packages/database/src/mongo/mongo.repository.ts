import type { Model } from "mongoose";
import type { FindOptions, Repository } from "../repository";

export class MongoRepository<T> implements Repository<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private readonly model: Model<any>) {}

  async findById(id: string) {
    return (await this.model.findById(id).lean()) as unknown as T | null;
  }
  async findMany(filter: Record<string, unknown> = {}, opts: FindOptions = {}) {
    const rows = await this.model
      .find(filter)
      .sort(opts.sort ?? {})
      .skip(opts.skip ?? 0)
      .limit(opts.limit ?? 20)
      .lean();
    return rows as unknown as T[];
  }
  async create(data: Partial<T>) {
    return (await this.model.create(data)).toObject() as unknown as T;
  }
  async update(id: string, data: Partial<T>) {
    return (await this.model.findByIdAndUpdate(id, data, { new: true }).lean()) as unknown as T | null;
  }
  async delete(id: string) {
    return (await this.model.findByIdAndDelete(id)) !== null;
  }
}
