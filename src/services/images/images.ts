// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  imagesDataValidator,
  imagesPatchValidator,
  imagesQueryValidator,
  imagesResolver,
  imagesExternalResolver,
  imagesDataResolver,
  imagesPatchResolver,
  imagesQueryResolver
} from './images.schema'

import type { Application } from '../../declarations'
import { ImagesService, getOptions } from './images.class'
import { imagesPath, imagesMethods } from './images.shared'

export * from './images.class'
export * from './images.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const images = (app: Application) => {
  // Register our service on the Feathers application
  app.use(imagesPath, new ImagesService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: imagesMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(imagesPath).hooks({
    around: {
      all: [schemaHooks.resolveExternal(imagesExternalResolver), schemaHooks.resolveResult(imagesResolver)]
    },
    before: {
      all: [schemaHooks.validateQuery(imagesQueryValidator), schemaHooks.resolveQuery(imagesQueryResolver)],
      find: [],
      get: [],
      create: [schemaHooks.validateData(imagesDataValidator), schemaHooks.resolveData(imagesDataResolver)],
      patch: [schemaHooks.validateData(imagesPatchValidator), schemaHooks.resolveData(imagesPatchResolver)],
      remove: []
    },
    after: {
      all: []
    },
    error: {
      all: []
    }
  })
}

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    [imagesPath]: ImagesService
  }
}
