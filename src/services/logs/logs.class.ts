// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { Params } from '@feathersjs/feathers'
import { MongoDBService } from '@feathersjs/mongodb'
import type { MongoDBAdapterParams, MongoDBAdapterOptions } from '@feathersjs/mongodb'

import type { Application, HookContext } from '../../declarations'
import type { Logs, LogsData, LogsPatch, LogsQuery, ChartLogs } from './logs.schema'
import _ from 'lodash'

export type { Logs, LogsData, LogsPatch, LogsQuery }

export interface LogsParams extends MongoDBAdapterParams<LogsQuery> {}

// By default calls the standard MongoDB adapter service methods but can be customized with your own functionality.
export class LogsService<ServiceParams extends Params = LogsParams> extends MongoDBService<
  Logs | ChartLogs,
  LogsData,
  LogsParams,
  LogsPatch
> {}

export const getOptions = (app: Application): MongoDBAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('mongodbClient').then(db => db.collection('logs')),
    useEstimatedDocumentCount: true
  }
}
