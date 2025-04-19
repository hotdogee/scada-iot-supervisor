// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type { Images, ImagesData, ImagesPatch, ImagesQuery, ImagesService } from './images.class'

export type { Images, ImagesData, ImagesPatch, ImagesQuery }

export type ImagesClientService = Pick<ImagesService<Params<ImagesQuery>>, (typeof imagesMethods)[number]>

export const imagesPath = 'images'

export const imagesMethods: Array<keyof ImagesService> = ['find', 'get', 'create', 'patch', 'remove']

export const imagesClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(imagesPath, connection.service(imagesPath), {
    methods: imagesMethods
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [imagesPath]: ImagesClientService
  }
}
