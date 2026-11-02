import Dexie, { type Table } from 'dexie'
import type { Activity } from '../../domain/models/activity'

export class RetomaDatabase extends Dexie {
  activities!: Table<Activity, Activity['id']>

  constructor(name = 'retoma') {
    super(name)

    this.version(1).stores({
      activities: 'id,status,updatedAt',
    })
  }
}

export const retomaDatabase = new RetomaDatabase()
