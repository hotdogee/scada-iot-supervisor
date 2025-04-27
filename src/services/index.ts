import { images } from './images/images'
import { logs } from './logs/logs'
// For more information about this file see https://dove.feathersjs.com/guides/cli/application.html#configure-functions
import type { Application } from '../declarations'

export const services = (app: Application) => {
  app.configure(images)
  app.configure(logs)
  // All services will be registered here
}
