import type { Activity, ActivityStatus } from '../models/activity'

export interface ActivityRepository {
  add(activity: Activity): Promise<void>
  getById(id: string): Promise<Activity | undefined>
  getAll(): Promise<Activity[]>
  getByStatus(status: ActivityStatus): Promise<Activity[]>
  update(activity: Activity): Promise<boolean>
}
