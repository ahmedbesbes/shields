'use strict'

const Joi = require('joi')
const pathToRegexp = require('path-to-regexp')

function makeFullUrl(base, partialUrl) {
  return `/${[base, partialUrl].filter(Boolean).join('/')}`
}

const routeSchema = Joi.object({
  base: Joi.string().allow(''),
  pattern: Joi.string().allow(''),
  format: Joi.string(),
  capture: Joi.alternatives().when('format', {
    is: Joi.string().required(),
    then: Joi.array().items(Joi.string().required()),
  }),
  queryParams: Joi.array().items(Joi.string().required()),
})
  .xor('pattern', 'format')
  .required()

function assertValidRoute(route, message = undefined) {
  Joi.assert(route, routeSchema, message)
}

function prepareRoute({ base, pattern, format, capture }) {
  let regex, captureNames
  if (pattern === undefined) {
    regex = new RegExp(
      `^${makeFullUrl(base, format)}\\.(svg|png|gif|jpg|json)$`
    )
    captureNames = capture || []
  } else {
    const fullPattern = `${makeFullUrl(
      base,
      pattern
    )}.:ext(svg|png|gif|jpg|json)`
    const keys = []
    regex = pathToRegexp(fullPattern, keys, {
      strict: true,
      sensitive: true,
    })
    captureNames = keys.map(item => item.name).slice(0, -1)
  }
  return { regex, captureNames }
}

function namedParamsForMatch(captureNames = [], match, ServiceClass) {
  // Assume the last match is the format, and drop match[0], which is the
  // entire match.
  const captures = match.slice(1, -1)

  if (captureNames.length !== captures.length) {
    throw new Error(
      `Service ${
        ServiceClass.name
      } declares incorrect number of capture groups ` +
        `(expected ${captureNames.length}, got ${captures.length})`
    )
  }

  const result = {}
  captureNames.forEach((name, index) => {
    result[name] = captures[index]
  })
  return result
}

module.exports = {
  makeFullUrl,
  assertValidRoute,
  prepareRoute,
  namedParamsForMatch,
}
