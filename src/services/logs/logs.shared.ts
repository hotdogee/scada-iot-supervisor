// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type { Logs, LogsData, LogsPatch, LogsQuery, LogsService } from './logs.class'

export type { Logs, LogsData, LogsPatch, LogsQuery }

export type LogsClientService = Pick<LogsService<Params<LogsQuery>>, (typeof logsMethods)[number]>

export const logsPath = 'logs'

export const logsMethods: Array<keyof LogsService> = ['find', 'get', 'create', 'patch', 'remove']

export const logsClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(logsPath, connection.service(logsPath), {
    methods: logsMethods
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [logsPath]: LogsClientService
  }
}
