import { uniq, set } from 'lodash'

let sideEffectTarget

/**
 * Simple implementation of ajv.compile().
 * If you want to add more validate, please refer to the ajv document for implementation:
 * refer: https://ajv.js.org/api.html
 * @function ValidateFunction
 * @param {string} config
 * @param {string} [configPath]
 * @return {boolean}
 * @affect
 */

/**
 * Schema definition should compatible with ajv@8.6.3
 * refer: https://ajv.js.org/json-schema.html
 * @param {object} schema
 * @param {string} [schemaPath]
 * @return {function: ValidateFunction}
 */
const validate = (schema, schemaPath = '') => (config, configPath = 'config') => {
  if (configPath === 'config') {
    sideEffectTarget = config
  }

  if (!schema) {
    throw new Error(`Schema error: unexpected key (node) of ${schemaPath}`)
  }

  if (schema.$ref) {
    // the dynamic import will be transform to switch function by custom rollup plugin rollup-plugin-dynamic-require-vars
    schema = require(`./schemas/${schema.$ref.replace('.json', '')}.json`).default
  }

  const { $id = '', oneOf, format, type } = schema
  let schemaFullPath = schemaPath

  if ($id) {
    schemaFullPath = $id
  }

  if (!(type && typeof type === 'string')) {
    throw new Error(`Schema error: missing type define of ${schemaFullPath}`)
  }

  if (oneOf) {
    if (!(oneOf instanceof Array)) {
      throw new Error(`Schema error: oneOf rule of ${schemaFullPath} should be an array`)
    }

    // recursive validate oneOf rule
    let oneOfValid = false
    let validError
    oneOf.some((item, index) => {
      let valid = false
      try {
        valid = validate(
          {
            type: schema.type,
            ...item
          },
          `${schemaFullPath}/oneOf[${index}]`
        )(config, configPath)
        // choose first valid type matched oneOf schema
        if (valid) {
          schema = {
            type: schema.type,
            ...item
          }
        }
      } catch (e) {
        validError = e
      }
      oneOfValid = valid

      return valid
    })
    if (!oneOfValid) {
      if (validError) {
        throw validError
      }

      throw new Error(`Config validate error: ${configPath} should match one of schema ${schemaFullPath}/oneOf`)
    }
  }

  if (format) {
    let regex = /.*/

    /*
     * format regex is copy from https://github.com/ajv-validator/ajv-formats/blob/v2.1.1/src/formats.ts
     */
    switch (format) {
      case 'hostname': {
        regex = /^(?=.{1,253}\.?$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[-0-9a-z]{0,61}[0-9a-z])?)*\.?$/i
        break
      }
      case 'ipv4': {
        regex = /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/
        break
      }
      case 'ipv6': {
        regex = /^((([0-9a-f]{1,4}:){7}([0-9a-f]{1,4}|:))|(([0-9a-f]{1,4}:){6}(:[0-9a-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){5}(((:[0-9a-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){4}(((:[0-9a-f]{1,4}){1,3})|((:[0-9a-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){3}(((:[0-9a-f]{1,4}){1,4})|((:[0-9a-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){2}(((:[0-9a-f]{1,4}){1,5})|((:[0-9a-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){1}(((:[0-9a-f]{1,4}){1,6})|((:[0-9a-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9a-f]{1,4}){1,7})|((:[0-9a-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))$/i
        break
      }
      case 'uri': {
        regex = /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/)?[^\s]*$/i
        break
      }
      default:
        throw new Error(`Schema error: unsupported format of ${schemaFullPath}`)
    }

    if (!regex.test(config)) {
      throw new Error(`Config validate error: ${configPath} should be the format of ${format}`)
    }
  }

  switch (type) {
    case 'object': {
      if (typeof config !== 'object' || config instanceof Array) {
        throw new Error(`Config validate error: ${configPath} should be an object`)
      }

      const { properties, required = [] } = schema

      if (!(properties && properties instanceof Object)) {
        throw new Error(`Schema error: missing properties define of type "object" schema node ${schemaFullPath}`)
      }

      if (Object.keys(properties).length > 0) {
        // recursive validate object properties
        uniq([
          ...Object.keys(config),
          // the properties with "default" define will also been included for validation
          ...Object.keys(properties).filter(key => Object.prototype.hasOwnProperty.call(properties[key], 'default'))
        ])
          .forEach(key => {
            validate(properties[key], `${schemaFullPath}/${key}`)(config[key], `${configPath}.${key}`)
          })
      }

      required.forEach(key => {
        if (!Object.prototype.hasOwnProperty.call(config, key)) {
          throw new Error(`Config validate error: missing required property "${key}" of ${configPath}`)
        }
      })

      break
    }
    case 'array' : {
      if (!(config instanceof Array)) {
        throw new Error(`Config validate error: ${configPath} should be an array`)
      }

      const { items, uniqueItems, minItems } = schema

      if (!(items && items instanceof Object)) {
        throw new Error(`Schema error: missing items define of type "array" schema node ${schemaFullPath}`)
      }

      if (minItems) {
        if (typeof minItems !== 'number') {
          throw new Error(`Schema error: minItems define of type "array" schema node ${schemaFullPath} should be a number`)
        }

        if (config.length < minItems) {
          throw new Error(`Config validate error: ${configPath} should contains at least ${minItems} item`)
        }
      }

      if (uniqueItems) {
        if (typeof uniqueItems !== 'boolean') {
          throw new Error(`Schema error: uniqueItems define of type "array" schema node ${schemaFullPath} should be a boolean`)
        }

        if (config.length !== uniq(config).length) {
          throw new Error(`Config validate error: items of ${configPath} should be unique`)
        }
      }

      // recursive validate array items
      config.forEach((item, index) => {
        validate(items, `${schemaFullPath}/${index}`)(item, `${configPath}[${index}]`)
      })

      break
    }
    case 'string': {
      const { enum: schemaEnum, default: schemaDefault, pattern } = schema

      if (Object.prototype.hasOwnProperty.call(schema, 'default')) {
        if (typeof schemaDefault !== 'string') {
          throw new Error(`Schema error: default define of type "string" schema node ${schemaFullPath} should be a string`)
        }

        if (typeof config !== 'string') {
          // side-effect set default value of config by schema define
          set({ config: sideEffectTarget }, configPath, schemaDefault)
          config = schemaDefault
        }
      }

      if (typeof config !== 'string') {
        throw new Error(`Config validate error: ${configPath} should be a string`)
      }

      if (schemaEnum) {
        if (!(schemaEnum instanceof Array)) {
          throw new Error(`Schema error: enum define of type "string" schema node ${schemaFullPath} should be an Array`)
        }

        if (!schemaEnum.includes(config)) {
          throw new Error(`Config validate error: ${configPath} should be a value in the enum ${schemaFullPath}/enum`)
        }
      }

      if (pattern) {
        let regex

        try {
          regex = new RegExp(pattern)
        } catch (e) {
          throw new Error(`Schema error: pattern define of type "string" ${schemaFullPath} should be a RegExp constructable string`)
        }

        if (!regex.test(config)) {
          throw new Error(`Config validate error: ${configPath} should match the pattern of ${schemaFullPath}/pattern`)
        }
      }

      break
    }
    case 'number': {
      if (typeof config !== 'number') {
        throw new Error(`Config validate error: ${configPath} should be a number`)
      }

      const { maximum } = schema

      if (maximum) {
        if (typeof maximum !== 'number') {
          throw new Error(`Schema error: maximum define of type "number" schema node ${schemaFullPath} should be a number`)
        }

        if (config > maximum) {
          throw new Error(`Config validate error: the maximum value of ${configPath} is ${maximum}`)
        }
      }

      break
    }
    case 'boolean': {
      const { default: schemaDefault } = schema

      if (Object.prototype.hasOwnProperty.call(schema, 'default')) {
        if (typeof schemaDefault !== 'boolean') {
          throw new Error(`Schema error: default define of type "boolean" schema node ${schemaFullPath} should be a boolean`)
        }

        if (typeof config !== 'boolean') {
          // side-effect set default value of config by schema define
          set({ config: sideEffectTarget }, configPath, schemaDefault)
          config = schemaDefault
        }
      }

      if (typeof config !== 'boolean') {
        throw new Error(`Config validate error: ${configPath} should be a boolean`)
      }

      break
    }
    case 'undefined':
      if (config !== undefined) {
        throw new Error(`Config validate error: ${configPath} accept undefined, but received ${typeof config}`)
      }

      break
    default:
      throw new Error(`Schema error: unsupported type of ${schemaFullPath}`)
  }

  return true
}

export default validate
