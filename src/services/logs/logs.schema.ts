// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import { ObjectIdSchema } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { LogsService } from './logs.class'
import _ from 'lodash'

// Main data model schema
export const logsSchema = Type.Object(
  {
    _id: ObjectIdSchema(),
    name: Type.String(),
    logTime: Type.String({ format: 'date-time' }),
    reads: Type.Array(
      Type.Object({
        name: Type.String(),
        addr: Type.Integer(),
        reads: Type.Array(
          Type.Object({
            name: Type.String(),
            time: Type.Date(),
            unit: Type.String(),
            value: Type.Union([
              Type.Number(),
              Type.Integer(),
              Type.Array(Type.Union([Type.Number(), Type.Integer()]))
            ])
          })
        )
      })
    )
  },
  { $id: 'Logs', additionalProperties: false }
)
export const chartLogsSchema = Type.Object(
  {
    bucket: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    start: Type.Optional(Type.Union([Type.Date(), Type.Null()])),
    end: Type.Optional(Type.Union([Type.Date(), Type.Null()])),
    total: Type.Optional(Type.Number()),
    data: Type.Optional(Type.Record(Type.String(), Type.Any()))
  },
  { $id: 'ChartLogs', additionalProperties: false }
)
export type ChartLogs = Static<typeof chartLogsSchema>
export type Logs = Static<typeof logsSchema>
export const logsValidator = getValidator(logsSchema, dataValidator)
export const logsResolver = resolve<Logs, HookContext<LogsService>>({})

export const logsExternalResolver = resolve<Logs, HookContext<LogsService>>({})

// Schema for creating new entries
export const logsDataSchema = Type.Pick(logsSchema, ['name', 'logTime', 'reads'], {
  $id: 'LogsData'
})
export type LogsData = Static<typeof logsDataSchema>
export const logsDataValidator = getValidator(logsDataSchema, dataValidator)
export const logsDataResolver = resolve<Logs, HookContext<LogsService>>({})

// Schema for updating existing entries
export const logsPatchSchema = Type.Partial(logsSchema, {
  $id: 'LogsPatch'
})
export type LogsPatch = Static<typeof logsPatchSchema>
export const logsPatchValidator = getValidator(logsPatchSchema, dataValidator)
export const logsPatchResolver = resolve<Logs, HookContext<LogsService>>({})

// Schema for allowed query properties
export const logsQueryProperties = Type.Pick(logsSchema, ['_id', 'name', 'logTime', 'reads'])
export const logsQuerySchema = Type.Intersect(
  [
    querySyntax(logsQueryProperties),
    // Add additional query properties here
    Type.Object(
      {
        $chart: Type.Optional(Type.Any())
      },
      { additionalProperties: false }
    )
  ],
  { additionalProperties: false }
)
export type LogsQuery = Static<typeof logsQuerySchema>
export const logsQueryValidator = getValidator(logsQuerySchema, queryValidator)
const buckets: Record<string, number> = {
  '1d': 60 * 60 * 24 * 1000,
  '12h': 60 * 60 * 12 * 1000,
  '6h': 60 * 60 * 6 * 1000,
  '3h': 60 * 60 * 3 * 1000,
  '2h': 60 * 60 * 2 * 1000,
  '1h': 60 * 60 * 1000,
  '30m': 60 * 30 * 1000,
  '20m': 60 * 20 * 1000,
  '10m': 60 * 10 * 1000,
  '5m': 60 * 5 * 1000,
  '2m': 60 * 2 * 1000,
  '1m': 60 * 1000,
  '30s': 30 * 1000,
  '20s': 20 * 1000,
  '10s': 10 * 1000,
  '1ms': 1
}

function twoPlaces(point: any) {
  point.y = Math.round(point.y * 100) / 100
  point.low = Math.round(point.low * 100) / 100
  point.high = Math.round(point.high * 100) / 100
  return point
}

export const logsQueryResolver = resolve<LogsQuery, HookContext<LogsService>>({
  // Convert string values for logTime operators ($gt, $lt, etc.) to Date objects
  logTime: (value: any) => {
    if (typeof value === 'object' && value !== null) {
      const processedValue = { ...value }
      for (const operator in processedValue) {
        if (['$gt', '$gte', '$lt', '$lte'].includes(operator)) {
          const dateValue = processedValue[operator]
          if (typeof dateValue === 'string') {
            processedValue[operator] = new Date(dateValue)
          }
        }
      }
      return processedValue
    }
    // Handle direct string value if needed, though less common for date ranges
    if (typeof value === 'string') {
      return new Date(value)
    }
    return value
  }
})

// result = {
//   total: 21704645,
//   limit: 1,
//   skip: 0,
//   data: [
//     {
//       _id: '5988df026280a15955031386',
//       name: 'Geo9',
//       logTime: '2017-08-07T20:39:30.088Z',
//       reads: []
//     }
//   ],
// }
// chartResult = {
//   bucket: '1d',
//   start: '2017-08-07T20:39:30.088Z',
//   end: '2019-08-12T11:55:39.281Z',
//   total: 21726035,
//   data: {
//     'M1-九號井口-溫度(℃)': [
//       { x: 1502150400000, y: 163.66, low: 130.97, high: 178.09 },
//     ]
//   }
// }
export const chartQueryResolver = resolve<LogsQuery, HookContext<LogsService>>({
  $chart: async (value, chartQuery, context) => {
    // this is run whether or not $chart is present
    if ('$chart' in chartQuery) {
      const { app, service: logs } = context
      const canvasSize = 500
      console.log('$chart', value, chartQuery)

      let start
      if (typeof chartQuery.logTime === 'object' && '$gt' in chartQuery.logTime && chartQuery.logTime.$gt) {
        start = chartQuery.logTime.$gt
      }
      if (!start) {
        // default to time of first log in db
        start = (
          (
            await logs.find({
              query: {
                $limit: 1,
                $sort: {
                  logTime: 1
                }
              }
            })
          ).data[0] as Logs
        ).logTime as unknown as Date
      }

      let end
      if (typeof chartQuery.logTime === 'object' && '$lt' in chartQuery.logTime && chartQuery.logTime.$lt) {
        end = chartQuery.logTime.$lt
      }
      if (!end) {
        // default to time of last log in db
        end = (
          (
            await logs.find({
              query: {
                $limit: 1,
                $sort: {
                  logTime: -1
                }
              }
            })
          ).data[0] as Logs
        ).logTime as unknown as Date
      }

      // Check if both start and end are valid Date objects before calculating range
      // range in ms
      const range = (end as unknown as number) - (start as unknown as number)
      console.log(`start: ${start}, end: ${end}, range: ${range}`)
      let bucket = 'all'
      for (const b in buckets) {
        if (range / buckets[b] > canvasSize) {
          bucket = b
          break
        }
      }
      const query = { logTime: { $gt: new Date(start), $lt: new Date(end) } }
      const db = await app.get('mongodbClient')
      if (bucket !== 'all') {
        const collection = db.collection(`logs.sanitized.${bucket}`)
        const result: Record<string, any[]> = {}
        const totalAgg = await collection
          .aggregate([{ $match: query }, { $group: { _id: null, count: { $sum: '$count' } } }])
          .toArray()
        const total = totalAgg[0]?.count || 0
        const docs = await collection.find(query).sort({ logTime: 1 }).toArray()
        console.log(`bucket: ${bucket}, total: ${total}, docs: ${docs.length}`)
        _.forEach(docs, doc => {
          const x = doc.logTime instanceof Date ? doc.logTime.getTime() : new Date(doc.logTime).getTime()
          _.forEach(doc.reads, (stat, key) => {
            if (!result[key]) result[key] = []
            stat.avg = stat.total / stat.count
            const point = { x, y: stat.avg, low: stat.min, high: stat.max }
            result[key].push(twoPlaces(point))
          })
          // calculate extra series
          const m63kW = doc.reads['M63-發電機1-三相功率(kW)']
          // const m13bar = doc.reads['M13-渦輪1前-壓力(bar)']
          // const m14bar = doc.reads['M14-渦輪1後-壓力(bar)']
          // const m25tph = doc.reads['M25-主排水管-質量流率(t/h)']
          const m13bar = doc.reads['M5-渦輪2前-壓力(bar)']
          const m14bar = doc.reads['M6-渦輪2後-壓力(bar)']
          const m25tph = doc.reads['M26-排水管2-流量(m3/h)']
          const m64hz = doc.reads['M64-發電機1-頻率(Hz)']
          const turbineRadius = 0.215 // m
          const nozzleAngle = (30 / 180) * Math.PI // radians
          const formulas: { [key: string]: (stat: string) => number | undefined } = {
            'M104-出噴嘴速度-計算(m/s)': stat => {
              if (m63kW && m25tph && m64hz) {
                const omega = 2 * Math.PI * m64hz[stat]
                const torque = (m63kW[stat] * 1000) / omega
                const force = torque / turbineRadius
                const kgs = (m25tph[stat] * 1000) / 3600
                const turbineSpeed = turbineRadius * omega
                const v2 = (force / (2 * kgs) + turbineSpeed) / Math.cos(nozzleAngle)
                // const v2 = ((m63kW[stat] * 1000) / (m64hz[stat] * m25tph[stat] * 2 * Math.PI * 0.215 * 2  * 1000 / 3600) + 0.215 * 2 * Math.PI * m64hz[stat]) / Math.cos(30 / 180 * Math.PI)
                // m63kW[stat] / (m64hz[stat] * m25tph[stat]) + m64hz[stat]
                return v2
              }
            }
          }
          let key = ''
          // M100-功率壓力-計算(kW/bar)
          //  = M63(kW)/(M13(bar)-M14(bar))
          // if (m63kW && m13bar && m14bar) {
          //   key = 'M100-功率壓力-計算(kW/bar)'
          //   if (!result[key]) {
          //     result[key] = []
          //   }
          //   const point = {
          //     x: x,
          //     y: m63kW.avg / (m13bar.avg - m14bar.avg),
          //     low: m63kW.min / (m13bar.min - m14bar.min),
          //     high: m63kW.max / (m13bar.max - m14bar.max)
          //   }
          //   result[key].push(point)
          // }
          // M101-功率壓力平方-計算(kW/bar2)
          //  = M63(kW)/(M13(bar)-M14(bar))^2
          if (m63kW && m13bar && m14bar) {
            key = 'M101-功率/壓力平方-計算(kW/bar2)'
            if (!result[key]) {
              result[key] = []
            }
            const point = {
              x,
              y: m63kW.avg / Math.pow(m13bar.avg - m14bar.avg, 2),
              low: m63kW.min / Math.pow(m13bar.min - m14bar.min, 2),
              high: m63kW.max / Math.pow(m13bar.max - m14bar.max, 2)
            }
            result[key].push(twoPlaces(point))
          }
          // M102-功率流量四次方-計算(kW/bar4)
          //  = M25(t/h)/(M13(bar)-M14(bar))
          // if (m63kW && m25tph) {
          //   key = 'M102-功率流量四次方-計算(kW/tph4)'
          //   if (!result[key]) {
          //     result[key] = []
          //   }
          //   const point = {
          //     x: x,
          //     y: Math.pow(m63kW.avg, 0.25) / m25tph.avg,
          //     low: Math.pow(m63kW.min, 0.25) / m25tph.min,
          //     high: Math.pow(m63kW.max, 0.25) / m25tph.max
          //   }
          //   result[key].push(point)
          // }
          // M103-流量壓力根-計算(kW/bar0.5)
          //  = M25(t/h)/(M13(bar)-M14(bar))^0.5
          if (m25tph && m13bar && m14bar) {
            key = 'M103-流量/壓力根-計算(tph/bar0.5)'
            if (!result[key]) {
              result[key] = []
            }
            const point = {
              x,
              y: m25tph.avg / Math.pow(m13bar.avg - m14bar.avg, 0.5),
              low: m25tph.min / Math.pow(m13bar.min - m14bar.min, 0.5),
              high: m25tph.max / Math.pow(m13bar.max - m14bar.max, 0.5)
            }
            result[key].push(twoPlaces(point))
          }
          // M104-出噴嘴速度-計算(m/s)
          if (m63kW && m25tph && m64hz) {
            key = 'M104-出噴嘴速度-計算(m/s)'
            if (!result[key]) {
              result[key] = []
            }
            const point = {
              x,
              y: formulas[key]('avg'),
              low: formulas[key]('min'),
              high: formulas[key]('max')
            }
            result[key].push(point)
            // M105-速度壓力根-計算(ms/bar0.5)
            if (m13bar && m14bar) {
              key = 'M105-速度壓力根-計算(ms/bar0.5)'
              if (!result[key]) {
                result[key] = []
              }
              const speedAvg = formulas['M104-出噴嘴速度-計算(m/s)']('avg') ?? 0
              const speedMin = formulas['M104-出噴嘴速度-計算(m/s)']('min') ?? 0
              const speedMax = formulas['M104-出噴嘴速度-計算(m/s)']('max') ?? 0
              const point = {
                x,
                y: speedAvg / Math.pow(m13bar.avg - m14bar.avg, 0.5),
                low: speedMin / Math.pow(m13bar.min - m14bar.min, 0.5),
                high: speedMax / Math.pow(m13bar.max - m14bar.max, 0.5)
              }
              result[key].push(twoPlaces(point))
            }
            // // M106-速度壓力-計算(ms/bar)
            // if (m13bar && m14bar) {
            //   key = 'M106-速度壓力-計算(ms/bar)'
            //   if (!result[key]) {
            //     result[key] = []
            //   }
            //   const point = {
            //     x: x,
            //     y: formulas['M104-出噴嘴速度-計算(m/s)']('avg') / Math.pow(m13bar.avg - m14bar.avg, 1),
            //     low: formulas['M104-出噴嘴速度-計算(m/s)']('min') / Math.pow(m13bar.min - m14bar.min, 1),
            //     high: formulas['M104-出噴嘴速度-計算(m/s)']('max') / Math.pow(m13bar.max - m14bar.max, 1)
            //   }
            //   result[key].push(point)
            // }
            // // M107-速度壓力平方-計算(ms/bar2)
            // if (m13bar && m14bar) {
            //   key = 'M107-速度壓力平方-計算(ms/bar2)'
            //   if (!result[key]) {
            //     result[key] = []
            //   }
            //   const point = {
            //     x: x,
            //     y: formulas['M104-出噴嘴速度-計算(m/s)']('avg') / Math.pow(m13bar.avg - m14bar.avg, 2),
            //     low: formulas['M104-出噴嘴速度-計算(m/s)']('min') / Math.pow(m13bar.min - m14bar.min, 2),
            //     high: formulas['M104-出噴嘴速度-計算(m/s)']('max') / Math.pow(m13bar.max - m14bar.max, 2)
            //   }
            //   result[key].push(point)
            // }
          }
        })
        console.log(`result: ${Object.keys(result).length}`)
        // Sort keys numerically by M number
        const headerRe = /^M(\d+)-([^-]+)-([^-]+)\(([^()]*)\)$/
        const sortedResult = _.sortBy(Object.keys(result), [
          k => parseInt(headerRe.exec(k)?.[1] || '0')
        ]).reduce(
          (r, k) => {
            r[k] = result[k]
            return r
          },
          {} as Record<string, any[]>
        )
        console.log(`sortedResult: ${Object.keys(sortedResult).length}`)
        context.result = { bucket, start, end, total, data: sortedResult } as ChartLogs
      } else {
        const collection = db.collection(`logs`)
        // No bucket, use raw logs
        const result: Record<string, any[]> = {}
        const docs = await collection.find(query).sort({ logTime: 1 }).toArray()
        _.forEach(docs, doc => {
          const x = doc.logTime instanceof Date ? doc.logTime.getTime() : new Date(doc.logTime).getTime()
          _.forEach(doc.reads, rtu => {
            _.forEach(rtu.reads, reg => {
              if (!rtu || !reg || !rtu.name || !reg.name || Array.isArray(reg.value)) return
              const key = `M${rtu.addr}-${rtu.name}-${reg.name}(${reg.unit})`
              if (!result[key]) result[key] = []
              const point = { x, y: reg.value, low: reg.value, high: reg.value }
              result[key].push(twoPlaces(point))
            })
          })
        })
        const headerRe = /^M(\d+)-([^-]+)-([^-]+)\(([^()]*)\)$/
        const sortedResult = _.sortBy(Object.keys(result), [
          k => parseInt(headerRe.exec(k)?.[1] || '0')
        ]).reduce(
          (r, k) => {
            r[k] = result[k]
            return r
          },
          {} as Record<string, any[]>
        )
        context.result = { bucket: null, start, end, total: docs.length, data: sortedResult } as ChartLogs
      }
    }
  }
})

export const handleChart = () => async (context: HookContext) => {
  const {
    app,
    params: { query: chartQuery },
    service: logs
  } = context
  const canvasSize = 500
  if (chartQuery && '$chart' in chartQuery) {
    // console.log('$chart', chartQuery)
    let start
    if (typeof chartQuery.logTime === 'object' && '$gt' in chartQuery.logTime && chartQuery.logTime.$gt) {
      start = chartQuery.logTime.$gt
    }
    if (!start) {
      // default to time of first log in db
      start = (
        (
          await logs.find({
            query: {
              $limit: 1,
              $sort: {
                logTime: 1
              }
            }
          })
        ).data[0] as Logs
      ).logTime as unknown as Date
    }

    let end
    if (typeof chartQuery.logTime === 'object' && '$lt' in chartQuery.logTime && chartQuery.logTime.$lt) {
      end = chartQuery.logTime.$lt
    }
    if (!end) {
      // default to time of last log in db
      end = (
        (
          await logs.find({
            query: {
              $limit: 1,
              $sort: {
                logTime: -1
              }
            }
          })
        ).data[0] as Logs
      ).logTime as unknown as Date
    }

    // Check if both start and end are valid Date objects before calculating range
    // range in ms
    const range = (end as unknown as number) - (start as unknown as number)
    console.log(`start: ${start}, end: ${end}, range: ${range}`)
    let bucket = 'all'
    for (const b in buckets) {
      if (range / buckets[b] > canvasSize) {
        bucket = b
        break
      }
    }
    const query = { logTime: { $gt: new Date(start), $lt: new Date(end) } }
    const db = await app.get('mongodbClient')
    if (bucket !== 'all') {
      const collection = db.collection(`logs.sanitized.${bucket}`)
      const result: Record<string, any[]> = {}
      const totalAgg = await collection
        .aggregate([{ $match: query }, { $group: { _id: null, count: { $sum: '$count' } } }])
        .toArray()
      const total = totalAgg[0]?.count || 0
      const docs = await collection.find(query).sort({ logTime: 1 }).toArray()
      _.forEach(docs, doc => {
        const x = doc.logTime instanceof Date ? doc.logTime.getTime() : new Date(doc.logTime).getTime()
        _.forEach(doc.reads, (stat, key) => {
          if (!result[key]) result[key] = []
          stat.avg = stat.total / stat.count
          const point = { x, y: stat.avg, low: stat.min, high: stat.max }
          result[key].push(twoPlaces(point))
        })
        // calculate extra series
        const m63kW = doc.reads['M63-發電機1-三相功率(kW)']
        // const m13bar = doc.reads['M13-渦輪1前-壓力(bar)']
        // const m14bar = doc.reads['M14-渦輪1後-壓力(bar)']
        // const m25tph = doc.reads['M25-主排水管-質量流率(t/h)']
        const m13bar = doc.reads['M5-渦輪2前-壓力(bar)']
        const m14bar = doc.reads['M6-渦輪2後-壓力(bar)']
        const m25tph = doc.reads['M26-排水管2-流量(m3/h)']
        const m64hz = doc.reads['M64-發電機1-頻率(Hz)']
        const turbineRadius = 0.215 // m
        const nozzleAngle = (30 / 180) * Math.PI // radians
        const formulas: { [key: string]: (stat: string) => number | undefined } = {
          'M104-出噴嘴速度-計算(m/s)': stat => {
            if (m63kW && m25tph && m64hz) {
              const omega = 2 * Math.PI * m64hz[stat]
              const torque = (m63kW[stat] * 1000) / omega
              const force = torque / turbineRadius
              const kgs = (m25tph[stat] * 1000) / 3600
              const turbineSpeed = turbineRadius * omega
              const v2 = (force / (2 * kgs) + turbineSpeed) / Math.cos(nozzleAngle)
              // const v2 = ((m63kW[stat] * 1000) / (m64hz[stat] * m25tph[stat] * 2 * Math.PI * 0.215 * 2  * 1000 / 3600) + 0.215 * 2 * Math.PI * m64hz[stat]) / Math.cos(30 / 180 * Math.PI)
              // m63kW[stat] / (m64hz[stat] * m25tph[stat]) + m64hz[stat]
              return v2
            }
          }
        }
        let key = ''
        // M100-功率壓力-計算(kW/bar)
        //  = M63(kW)/(M13(bar)-M14(bar))
        // if (m63kW && m13bar && m14bar) {
        //   key = 'M100-功率壓力-計算(kW/bar)'
        //   if (!result[key]) {
        //     result[key] = []
        //   }
        //   const point = {
        //     x: x,
        //     y: m63kW.avg / (m13bar.avg - m14bar.avg),
        //     low: m63kW.min / (m13bar.min - m14bar.min),
        //     high: m63kW.max / (m13bar.max - m14bar.max)
        //   }
        //   result[key].push(point)
        // }
        // M101-功率壓力平方-計算(kW/bar2)
        //  = M63(kW)/(M13(bar)-M14(bar))^2
        if (m63kW && m13bar && m14bar) {
          key = 'M101-功率/壓力平方-計算(kW/bar2)'
          if (!result[key]) {
            result[key] = []
          }
          const point = {
            x,
            y: m63kW.avg / Math.pow(m13bar.avg - m14bar.avg, 2),
            low: m63kW.min / Math.pow(m13bar.min - m14bar.min, 2),
            high: m63kW.max / Math.pow(m13bar.max - m14bar.max, 2)
          }
          result[key].push(twoPlaces(point))
        }
        // M102-功率流量四次方-計算(kW/bar4)
        //  = M25(t/h)/(M13(bar)-M14(bar))
        // if (m63kW && m25tph) {
        //   key = 'M102-功率流量四次方-計算(kW/tph4)'
        //   if (!result[key]) {
        //     result[key] = []
        //   }
        //   const point = {
        //     x: x,
        //     y: Math.pow(m63kW.avg, 0.25) / m25tph.avg,
        //     low: Math.pow(m63kW.min, 0.25) / m25tph.min,
        //     high: Math.pow(m63kW.max, 0.25) / m25tph.max
        //   }
        //   result[key].push(point)
        // }
        // M103-流量壓力根-計算(kW/bar0.5)
        //  = M25(t/h)/(M13(bar)-M14(bar))^0.5
        if (m25tph && m13bar && m14bar) {
          key = 'M103-流量/壓力根-計算(tph/bar0.5)'
          if (!result[key]) {
            result[key] = []
          }
          const point = {
            x,
            y: m25tph.avg / Math.pow(m13bar.avg - m14bar.avg, 0.5),
            low: m25tph.min / Math.pow(m13bar.min - m14bar.min, 0.5),
            high: m25tph.max / Math.pow(m13bar.max - m14bar.max, 0.5)
          }
          result[key].push(twoPlaces(point))
        }
        // M104-出噴嘴速度-計算(m/s)
        if (m63kW && m25tph && m64hz) {
          key = 'M104-出噴嘴速度-計算(m/s)'
          if (!result[key]) {
            result[key] = []
          }
          const point = {
            x,
            y: formulas[key]('avg'),
            low: formulas[key]('min'),
            high: formulas[key]('max')
          }
          result[key].push(point)
          // M105-速度壓力根-計算(ms/bar0.5)
          if (m13bar && m14bar) {
            key = 'M105-速度壓力根-計算(ms/bar0.5)'
            if (!result[key]) {
              result[key] = []
            }
            const speedAvg = formulas['M104-出噴嘴速度-計算(m/s)']('avg') ?? 0
            const speedMin = formulas['M104-出噴嘴速度-計算(m/s)']('min') ?? 0
            const speedMax = formulas['M104-出噴嘴速度-計算(m/s)']('max') ?? 0
            const point = {
              x,
              y: speedAvg / Math.pow(m13bar.avg - m14bar.avg, 0.5),
              low: speedMin / Math.pow(m13bar.min - m14bar.min, 0.5),
              high: speedMax / Math.pow(m13bar.max - m14bar.max, 0.5)
            }
            result[key].push(twoPlaces(point))
          }
          // // M106-速度壓力-計算(ms/bar)
          // if (m13bar && m14bar) {
          //   key = 'M106-速度壓力-計算(ms/bar)'
          //   if (!result[key]) {
          //     result[key] = []
          //   }
          //   const point = {
          //     x: x,
          //     y: formulas['M104-出噴嘴速度-計算(m/s)']('avg') / Math.pow(m13bar.avg - m14bar.avg, 1),
          //     low: formulas['M104-出噴嘴速度-計算(m/s)']('min') / Math.pow(m13bar.min - m14bar.min, 1),
          //     high: formulas['M104-出噴嘴速度-計算(m/s)']('max') / Math.pow(m13bar.max - m14bar.max, 1)
          //   }
          //   result[key].push(point)
          // }
          // // M107-速度壓力平方-計算(ms/bar2)
          // if (m13bar && m14bar) {
          //   key = 'M107-速度壓力平方-計算(ms/bar2)'
          //   if (!result[key]) {
          //     result[key] = []
          //   }
          //   const point = {
          //     x: x,
          //     y: formulas['M104-出噴嘴速度-計算(m/s)']('avg') / Math.pow(m13bar.avg - m14bar.avg, 2),
          //     low: formulas['M104-出噴嘴速度-計算(m/s)']('min') / Math.pow(m13bar.min - m14bar.min, 2),
          //     high: formulas['M104-出噴嘴速度-計算(m/s)']('max') / Math.pow(m13bar.max - m14bar.max, 2)
          //   }
          //   result[key].push(point)
          // }
        }
      })
      // Sort keys numerically by M number
      const headerRe = /^M(\d+)-([^-]+)-([^-]+)\(([^()]*)\)$/
      const sortedResult = _.sortBy(Object.keys(result), [
        k => parseInt(headerRe.exec(k)?.[1] || '0')
      ]).reduce(
        (r, k) => {
          r[k] = result[k]
          return r
        },
        {} as Record<string, any[]>
      )
      console.log(
        `bucket: ${bucket}, total: ${total}, series: ${Object.keys(sortedResult).length}, points/series: ${docs.length}, total data: ${docs.length * Object.keys(sortedResult).length * 4}`
      )
      context.result = { bucket, start, end, total, data: sortedResult } as ChartLogs
    } else {
      const collection = db.collection(`logs`)
      // No bucket, use raw logs
      const result: Record<string, any[]> = {}
      const docs = await collection.find(query).sort({ logTime: 1 }).toArray()
      _.forEach(docs, doc => {
        const x = doc.logTime instanceof Date ? doc.logTime.getTime() : new Date(doc.logTime).getTime()
        _.forEach(doc.reads, rtu => {
          _.forEach(rtu.reads, reg => {
            if (!rtu || !reg || !rtu.name || !reg.name || Array.isArray(reg.value)) return
            const key = `M${rtu.addr}-${rtu.name}-${reg.name}(${reg.unit})`
            if (!result[key]) result[key] = []
            const point = { x, y: reg.value, low: reg.value, high: reg.value }
            result[key].push(twoPlaces(point))
          })
        })
      })
      const headerRe = /^M(\d+)-([^-]+)-([^-]+)\(([^()]*)\)$/
      const sortedResult = _.sortBy(Object.keys(result), [
        k => parseInt(headerRe.exec(k)?.[1] || '0')
      ]).reduce(
        (r, k) => {
          r[k] = result[k]
          return r
        },
        {} as Record<string, any[]>
      )
      context.result = { bucket: null, start, end, total: docs.length, data: sortedResult } as ChartLogs
    }
    context.params.query = {}
  }
  return context
}

export const upsertRollup = () => async (context: HookContext) => {
  const data = context.result
  const db = await context.app.get('mongodbClient')
  const options = { upsert: true }
  const update: any = {
    $set: { name: data.name, logTime: data.logTime },
    $inc: { count: 1 },
    $min: {},
    $max: {}
  }
  _.forEach(data.reads, (rtu: any) => {
    _.forEach(rtu.reads, (reg: any) => {
      if (!rtu || !reg || !rtu.name || !reg.name) return
      if (reg.value > 30000 && (reg.unit === '' || reg.unit === 'kW')) return
      if (reg.unit === '\u2103' && (reg.value < 0 || reg.value > 400)) return
      if ([50, 51, 60, 61].includes(rtu.addr) && reg.unit === '\u2103' && reg.value > 100) return
      if (reg.unit === 'm3/h' && (reg.value < 0 || reg.value > 50)) return
      if (reg.unit === 'bar' && reg.value < 0.5) return
      if (reg.unit === 'Hz' && reg.value < 0) return
      if (Array.isArray(reg.value)) return
      if (reg.value != null) {
        let unit = reg.unit
        let value = reg.value
        if (reg.unit === '\u00b0C') unit = '\u2103'
        else if (reg.unit === 'W') {
          unit = 'kW'
          value /= 1000
        } else if (reg.unit === 'var') {
          unit = 'kvar'
          value /= 1000
        } else if (reg.unit === 'VA') {
          unit = 'kVA'
          value /= 1000
        }
        const key = `M${rtu.addr}-${rtu.name}-${reg.name}(${unit})`
        update.$inc[`reads.${key}.count`] = 1
        update.$inc[`reads.${key}.total`] = value
        update.$min[`reads.${key}.min`] = value
        update.$max[`reads.${key}.max`] = value
      }
    })
  })
  for (const b in buckets) {
    const logTime = new Date(data.logTime - (data.logTime % buckets[b]))
    const query = { name: data.name, logTime }
    const bupdate = Object.assign({}, update)
    bupdate.$set = query
    await db.collection(`logs.sanitized.${b}`).updateOne(query, bupdate, options)
  }
}
