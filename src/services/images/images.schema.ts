// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import { ObjectIdSchema } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { ImagesService } from './images.class'

// Main data model schema
export const imagesSchema = Type.Object(
  {
    _id: ObjectIdSchema(),
    timestamp: Type.Date(),
    albumId: ObjectIdSchema(),
    key: Type.String(),
    created: Type.Date(),
    updated: Type.Date()
  },
  { $id: 'Images', additionalProperties: false }
)
export type Images = Static<typeof imagesSchema>
export const imagesValidator = getValidator(imagesSchema, dataValidator)
export const imagesResolver = resolve<Images, HookContext<ImagesService>>({})

export const imagesExternalResolver = resolve<Images, HookContext<ImagesService>>({})

// Schema for creating new entries
export const imagesDataSchema = Type.Pick(
  imagesSchema,
  ['timestamp', 'albumId', 'key', 'created', 'updated'],
  {
    $id: 'ImagesData'
  }
)
export type ImagesData = Static<typeof imagesDataSchema>
export const imagesDataValidator = getValidator(imagesDataSchema, dataValidator)
export const imagesDataResolver = resolve<Images, HookContext<ImagesService>>({})

// Schema for updating existing entries
export const imagesPatchSchema = Type.Partial(imagesSchema, {
  $id: 'ImagesPatch'
})
export type ImagesPatch = Static<typeof imagesPatchSchema>
export const imagesPatchValidator = getValidator(imagesPatchSchema, dataValidator)
export const imagesPatchResolver = resolve<Images, HookContext<ImagesService>>({})

// Schema for allowed query properties
export const imagesQueryProperties = Type.Pick(imagesSchema, [
  '_id',
  'timestamp',
  'albumId',
  'key',
  'created',
  'updated'
])
export const imagesQuerySchema = Type.Intersect(
  [
    querySyntax(imagesQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export type ImagesQuery = Static<typeof imagesQuerySchema>
export const imagesQueryValidator = getValidator(imagesQuerySchema, queryValidator)
export const imagesQueryResolver = resolve<ImagesQuery, HookContext<ImagesService>>({})
