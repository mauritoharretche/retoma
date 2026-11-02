import { activitySchema, type Activity, type ActivityStatus } from '../../domain/models/activity'
import type { ActivityRepository } from '../../domain/repositories/activity-repository'
import { RetomaDatabase, retomaDatabase } from './retoma-database'

export class DexieActivityRepository implements ActivityRepository {
  private readonly database: RetomaDatabase

  constructor(database: RetomaDatabase = retomaDatabase) {
    this.database = database
  }

  async add(activity: Activity): Promise<void> {
    const validatedActivity = activitySchema.parse(activity)

    await this.database.activities.add(validatedActivity)
  }

  async getById(id: string): Promise<Activity | undefined> {
    return this.database.activities.get(id)
  }

  async getAll(): Promise<Activity[]> {
    return this.database.activities.toArray()
  }

  async getByStatus(status: ActivityStatus): Promise<Activity[]> {
    return this.database.activities.where('status').equals(status).toArray()
  }

  async update(activity: Activity): Promise<boolean> {
    const validatedActivity = activitySchema.parse(activity)

    return this.database.transaction('rw', this.database.activities, async () => {
      const existingActivity = await this.database.activities.get(validatedActivity.id)

      if (!existingActivity) {
        return false
      }

      await this.database.activities.put(validatedActivity)

      return true
    })
  }
}
