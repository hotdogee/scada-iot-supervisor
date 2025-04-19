// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  logsDataValidator,
  logsPatchValidator,
  logsQueryValidator,
  logsResolver,
  logsExternalResolver,
  logsDataResolver,
  logsPatchResolver,
  logsQueryResolver,
  chartQueryResolver,
  upsertRollup,
  handleChart
} from './logs.schema'

import type { Application } from '../../declarations'
import { LogsService, getOptions } from './logs.class'
import { logsPath, logsMethods } from './logs.shared'

export * from './logs.class'
export * from './logs.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const logs = (app: Application) => {
  // Register our service on the Feathers application
  app.use(logsPath, new LogsService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: logsMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(logsPath).hooks({
    around: {
      all: [schemaHooks.resolveExternal(logsExternalResolver), schemaHooks.resolveResult(logsResolver)],
      create: [authenticate('jwt')],
      patch: [authenticate('jwt')],
      remove: [authenticate('jwt')]
    },
    before: {
      all: [
        schemaHooks.validateQuery(logsQueryValidator),
        schemaHooks.resolveQuery(logsQueryResolver)
        // schemaHooks.resolveQuery(chartQueryResolver)
      ],
      find: [handleChart()],
      get: [],
      create: [schemaHooks.validateData(logsDataValidator), schemaHooks.resolveData(logsDataResolver)],
      patch: [schemaHooks.validateData(logsPatchValidator), schemaHooks.resolveData(logsPatchResolver)],
      remove: []
    },
    after: {
      all: [],
      create: [upsertRollup()]
    },
    error: {
      all: []
    }
  })
}

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    [logsPath]: LogsService
  }
}
