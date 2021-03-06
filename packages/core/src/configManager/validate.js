import { uniq, set, cloneDeep } from 'lodash'

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
    throw new TypeError(`Schema error: unexpected key or property at ${schemaPath}`)
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
    throw new TypeError(`Schema error: missing type define of ${schemaFullPath}`)
  }

  let schemaWillBeChangedByOneOf = schema

  if (oneOf) {
    if (!(oneOf instanceof Array)) {
      throw new TypeError(`Schema error: oneOf rule of ${schemaFullPath} should be an array`)
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
          schemaWillBeChangedByOneOf = {
            ...schema,
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
    if (!oneOfValid && validError) {
      throw new TypeError(`Config validate error: ${configPath} should match one of schema ${schemaFullPath}/oneOf`)
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
        throw new TypeError(`Schema error: unsupported format of ${schemaFullPath}`)
    }

    if (!regex.test(config)) {
      throw new TypeError(`Config validate error: ${configPath} should be the format of ${format} of schema node ${schemaFullPath}`)
    }
  }

  const { type: typeWillBeChangedByOneOf } = schemaWillBeChangedByOneOf

  switch (typeWillBeChangedByOneOf) {
    case 'object': {
      // TODO support default value of object type

      if (typeof config !== 'object' || config instanceof Array) {
        throw new TypeError(`Config validate error: ${configPath} should be an object`)
      }

      const { properties, required = [] } = schemaWillBeChangedByOneOf

      if (!(properties && properties instanceof Object)) {
        throw new TypeError(`Schema error: missing properties define of type "object" schema node ${schemaFullPath}`)
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
          throw new TypeError(`Config validate error: missing required property "${key}" of ${configPath}`)
        }
      })

      break
    }
    case 'array' : {
      const { default: schemaDefault } = schemaWillBeChangedByOneOf

      if (Object.prototype.hasOwnProperty.call(schemaWillBeChangedByOneOf, 'default')) {
        if (!(schemaDefault instanceof Array)) {
          throw new TypeError(`Schema error: default define of type "array" schema node ${schemaFullPath} should be an Array`)
        }

        if (!config && !(config instanceof Array)) {
          const defaultValue = cloneDeep(schemaDefault)
          // side-effect set default value of config by schema define
          set({ config: sideEffectTarget }, configPath, defaultValue)
          config = defaultValue
        }
      }

      if (!(config instanceof Array)) {
        throw new TypeError(`Config validate error: ${configPath} should be an array`)
      }

      const { items, uniqueItems, minItems } = schemaWillBeChangedByOneOf

      if (!(items && items instanceof Object)) {
        throw new TypeError(`Schema error: missing items define of type "array" schema node ${schemaFullPath}`)
      }

      if (minItems) {
        if (typeof minItems !== 'number') {
          throw new TypeError(`Schema error: minItems define of type "array" schema node ${schemaFullPath} should be a number`)
        }

        if (config.length < minItems) {
          throw new TypeError(`Config validate error: ${configPath} should contains at least ${minItems} item`)
        }
      }

      if (uniqueItems) {
        if (typeof uniqueItems !== 'boolean') {
          throw new TypeError(`Schema error: uniqueItems define of type "array" schema node ${schemaFullPath} should be a boolean`)
        }

        if (config.length !== uniq(config).length) {
          throw new TypeError(`Config validate error: items of ${configPath} should be unique`)
        }
      }

      // recursive validate array items
      config.forEach((item, index) => {
        validate(items, `${schemaFullPath}/${index}`)(item, `${configPath}[${index}]`)
      })

      break
    }
    case 'string': {
      const { enum: schemaEnum, default: schemaDefault, pattern } = schemaWillBeChangedByOneOf

      if (Object.prototype.hasOwnProperty.call(schemaWillBeChangedByOneOf, 'default')) {
        if (typeof schemaDefault !== 'string') {
          throw new TypeError(`Schema error: default define of type "string" schema node ${schemaFullPath} should be a string`)
        }

        if (typeof config !== 'string') {
          // side-effect set default value of config by schema define
          set({ config: sideEffectTarget }, configPath, schemaDefault)
          config = schemaDefault
        }
      }

      if (typeof config !== 'string') {
        throw new TypeError(`Config validate error: ${configPath} should be a string`)
      }

      if (schemaEnum) {
        if (!(schemaEnum instanceof Array)) {
          throw new TypeError(`Schema error: enum define of type "string" schema node ${schemaFullPath} should be an Array`)
        }

        if (!schemaEnum.includes(config)) {
          throw new TypeError(`Config validate error: ${configPath} should be a value in the enum ${schemaFullPath}/enum`)
        }
      }

      if (pattern) {
        let regex

        try {
          regex = new RegExp(pattern)
        } catch (e) {
          throw new TypeError(`Schema error: pattern define of type "string" ${schemaFullPath} should be a RegExp constructable string`)
        }

        if (!regex.test(config)) {
          throw new TypeError(`Config validate error: ${configPath} should match the pattern of ${schemaFullPath}/pattern`)
        }
      }

      break
    }
    case 'number': {
      // TODO support default value of number type

      if (typeof config !== 'number') {
        throw new TypeError(`Config validate error: ${configPath} should be a number`)
      }

      const { maximum } = schemaWillBeChangedByOneOf

      if (maximum) {
        if (typeof maximum !== 'number') {
          throw new TypeError(`Schema error: maximum define of type "number" schema node ${schemaFullPath} should be a number`)
        }

        if (config > maximum) {
          throw new TypeError(`Config validate error: the maximum value of ${configPath} is ${maximum}`)
        }
      }

      break
    }
    case 'boolean': {
      const { default: schemaDefault } = schemaWillBeChangedByOneOf

      if (Object.prototype.hasOwnProperty.call(schemaWillBeChangedByOneOf, 'default')) {
        if (typeof schemaDefault !== 'boolean') {
          throw new TypeError(`Schema error: default define of type "boolean" schema node ${schemaFullPath} should be a boolean`)
        }

        if (typeof config !== 'boolean') {
          // side-effect set default value of config by schema define
          set({ config: sideEffectTarget }, configPath, schemaDefault)
          config = schemaDefault
        }
      }

      if (typeof config !== 'boolean') {
        throw new TypeError(`Config validate error: ${configPath} should be a boolean`)
      }

      break
    }
    case 'undefined':
      if (config !== undefined) {
        throw new TypeError(`Config validate error: ${configPath} accept undefined, but received ${typeof config}`)
      }

      break
    default:
      throw new TypeError(`Schema error: unsupported type of ${schemaFullPath}`)
  }

  return true
}

export default validate
