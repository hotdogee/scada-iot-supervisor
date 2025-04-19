// For more information about this file see https://dove.feathersjs.com/guides/cli/service.test.html
import assert from 'assert'
import { app } from '../../../src/app'

describe('logs service', () => {
  it('registered the service', async () => {
    const service = app.service('logs')

    const params = {
      query: {
        $limit: 10,
        $select: ['logTime' as 'logTime'], // Use type assertion to match required type
        $sort: {
          logTime: -1
        }
        // logTime: {
        //   $gt: new Date((new Date().getTime() - 1*60*1000)).toISOString() // find all logs within 1 minute
        // }
      }
    }
    const results = await service.find(params)
    assert.ok(results, 'Registered the service')
  })
})
