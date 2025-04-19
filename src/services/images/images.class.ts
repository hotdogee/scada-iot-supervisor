// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { Params } from '@feathersjs/feathers'
import { MongoDBService } from '@feathersjs/mongodb'
import type { MongoDBAdapterParams, MongoDBAdapterOptions } from '@feathersjs/mongodb'

import type { Application } from '../../declarations'
import type { Images, ImagesData, ImagesPatch, ImagesQuery } from './images.schema'

export type { Images, ImagesData, ImagesPatch, ImagesQuery }

export interface ImagesParams extends MongoDBAdapterParams<ImagesQuery> {}

// By default calls the standard MongoDB adapter service methods but can be customized with your own functionality.
export class ImagesService<ServiceParams extends Params = ImagesParams> extends MongoDBService<
  Images,
  ImagesData,
  ImagesParams,
  ImagesPatch
> {}

export const getOptions = (app: Application): MongoDBAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('mongodbClient').then(db => db.collection('images'))
  }
}
