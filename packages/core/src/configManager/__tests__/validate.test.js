import getValidate from '../validate'

describe('validate', () => {
  test('type object', () => {
    const schema = {
      $id: 'mockedSchema_type_object',
      type: 'object',
      properties: {
        expectedKey: {
          type: 'object',
          properties: {}
        },
        requiredKey: {
          type: 'object',
          properties: {}
        }
      },
      required: ['requiredKey']
    }
    const validate = getValidate(schema)

    expect(validate({ requiredKey: {} })).toBe(true)

    try {
      validate('nonObject')
    } catch (error) {
      expect(error).toMatchSnapshot('failed with non-object')
    }

    try {
      validate({ unexpectedKey: {} })
    } catch (error) {
      expect(error).toMatchSnapshot('failed with unexpected key')
    }

    try {
      validate({ expectedKey: {} })
    } catch (error) {
      expect(error).toMatchSnapshot('failed with missing required key')
    }
  })

  test('type object failed with wrong schema', () => {
    const validate = getValidate({
      $id: 'mockedSchema_type_object_failed',
      type: 'object'
    })

    try {
      validate({})
    } catch (error) {
      expect(error).toMatchSnapshot('missing "properties" define')
    }
  })

  test('type array', () => {
    const defaultValue = [{ defaultItem: {} }]
    const config = {}
    const schema = {
      $id: 'mockedSchema_type_array',
      type: 'object',
      properties: {
        arrayProperty: {
          type: 'array',
          items: {
            type: 'object',
            properties: {}
          },
          default: defaultValue
        }
      }
    }
    const validate = getValidate(schema)

    expect(validate(config)).toBe(true)
    // `default` schema will side effects the validated config object
    expect(config.arrayProperty).toEqual(defaultValue)

    try {
      validate({
        arrayProperty: 'nonArray'
      })
    } catch (error) {
      expect(error).toMatchSnapshot('failed with non-array')
    }
  })

  test('type array with minItems', () => {
    const schema = {
      $id: 'mockedSchema_type_array_minItems',
      type: 'array',
      items: {
        type: 'object',
        properties: {}
      },
      minItems: 2
    }
    const validate = getValidate(schema)

    expect(validate([{}, {}])).toBe(true)

    try {
      validate([{}])
    } catch (error) {
      expect(error).toMatchSnapshot('failed')
    }
  })

  test('type array with uniqueItems', () => {
    const schema = {
      $id: 'mockedSchema_type_array_uniqueItems',
      type: 'array',
      items: { type: 'string' },
      uniqueItems: true
    }
    const validate = getValidate(schema)

    expect(validate(['a', 'b'])).toBe(true)

    try {
      validate(['a', 'a'])
    } catch (error) {
      expect(error).toMatchSnapshot('failed')
    }
  })

  test('type array failed with wrong schema', () => {
    try {
      getValidate({
        $id: 'mockedSchema_type_array_wrong1',
        type: 'array',
        items: {},
        default: 'nonArray'
      })([])
    } catch (error) {
      expect(error).toMatchSnapshot('wrong "default" define')
    }

    try {
      getValidate({
        $id: 'mockedSchema_type_array_wrong2',
        type: 'array'
      })([])
    } catch (error) {
      expect(error).toMatchSnapshot('missing "items" define')
    }

    try {
      getValidate({
        $id: 'mockedSchema_type_array_wrong3',
        type: 'array',
        items: {},
        minItems: 'nonNumber'
      })([])
    } catch (error) {
      expect(error).toMatchSnapshot('wrong "minItems" define')
    }

    try {
      getValidate({
        $id: 'mockedSchema_type_array_wrong4',
        type: 'array',
        items: {},
        uniqueItems: 'nonBoolean'
      })([])
    } catch (error) {
      expect(error).toMatchSnapshot('wrong "uniqueItems" define')
    }
  })

  test('type string', () => {
    const defaultValue = 'defaultString'
    const config = {}
    const schema = {
      $id: 'mockedSchema_type_string',
      type: 'object',
      properties: {
        stringProperty: {
          type: 'string',
          default: defaultValue
        }
      }
    }
    const validate = getValidate(schema)

    expect(validate(config)).toBe(true)
    // `default` schema will side effects the validated config object
    expect(config.stringProperty).toBe(defaultValue)

    try {
      getValidate({
        $id: 'mockedSchema_type_string_failed',
        type: 'string'
      })({ nonString: true })
    } catch (error) {
      expect(error).toMatchSnapshot('failed with non-string')
    }
  })

  test('type string with enum', () => {
    const schema = {
      $id: 'mockedSchema_type_string_enum',
      type: 'string',
      enum: [
        'expectedEnum1',
        'expectedEnum2'
      ]
    }
    const validate = getValidate(schema)

    expect(validate('expectedEnum1')).toBe(true)

    try {
      expect(validate('unexpectedEnum'))
    } catch (error) {
      expect(error).toMatchSnapshot('failed with unexpected enum')
    }
  })

  test('type string with pattern', () => {
    const schema = {
      $id: 'mockedSchema_type_string_pattern',
      type: 'string',
      pattern: '^expectedPattern$'
    }
    const validate = getValidate(schema)

    expect(validate('expectedPattern')).toBe(true)

    try {
      expect(validate('unexpectedPattern'))
    } catch (error) {
      expect(error).toMatchSnapshot('failed with unexpected pattern')
    }
  })

  test('type string failed with wrong schema', () => {
    try {
      getValidate({
        $id: 'mockedSchema_type_string_wrong1',
        type: 'string',
        default: ['nonString']
      })('string')
    } catch (error) {
      expect(error).toMatchSnapshot('wrong "default" define')
    }

    try {
      getValidate({
        $id: 'mockedSchema_type_string_wrong2',
        type: 'string',
        enum: 'nonArray'
      })('string')
    } catch (error) {
      expect(error).toMatchSnapshot('wrong "enum" define')
    }

    try {
      getValidate({
        $id: 'mockedSchema_type_string_wrong3',
        type: 'string',
        pattern: '['
      })('string')
    } catch (error) {
      expect(error).toMatchSnapshot('wrong "pattern" define')
    }
  })

  test('type number', () => {
    const schema = {
      $id: 'mockedSchema_type_array_wrong4',
      type: 'number',
      maximum: 200
    }
    const validate = getValidate(schema)

    expect(validate(123)).toBe(true)

    try {
      validate('nonNumber')
    } catch (error) {
      expect(error).toMatchSnapshot('failed with non-number')
    }

    try {
      validate(999)
    } catch (error) {
      expect(error).toMatchSnapshot('failed with maximum')
    }
  })

  test('type number failed with wrong schema', () => {
    try {
      getValidate({
        $id: 'mockedSchema_type_number_wrong1',
        type: 'number',
        maximum: 'nonNumber'
      })(123)
    } catch (error) {
      expect(error).toMatchSnapshot('wrong "maximum" define')
    }
  })

  test('type boolean', () => {
    const defaultValue = true
    const config = {}
    const schema = {
      $id: 'mockedSchema_type_boolean',
      type: 'object',
      properties: {
        booleanProperty: {
          type: 'boolean',
          default: defaultValue
        }
      }
    }
    const validate = getValidate(schema)

    expect(validate(config)).toBe(true)
    // `default` schema will side effects the validated config object
    expect(config.booleanProperty).toBe(defaultValue)

    try {
      validate(
        getValidate({
          $id: 'mockedSchema_type_boolean_failed',
          type: 'boolean'
        })('nonBoolean'))
    } catch (error) {
      expect(error).toMatchSnapshot('failed with non-boolean')
    }
  })

  test('type boolean failed with wrong schema', () => {
    try {
      getValidate({
        $id: 'mockedSchema_type_boolean_wrong1',
        type: 'boolean',
        default: 'nonBoolean'
      })(true)
    } catch (error) {
      expect(error).toMatchSnapshot('wrong "default" define')
    }
  })

  test('type undefined', () => {
    const schema = {
      $id: 'mockedSchema_type_undefined',
      type: 'undefined'
    }
    const validate = getValidate(schema)

    expect(validate(undefined)).toBe(true)

    try {
      validate('nonUndefined')
    } catch (error) {
      expect(error).toMatchSnapshot('failed with non-undefined')
    }
  })

  test('type unsupported', () => {
    try {
      getValidate({
        $id: 'mockedSchema_type_unsupported',
        type: 'unsupported'
      })(() => {})
    } catch (error) {
      expect(error).toMatchSnapshot()
    }
  })

  test('missing type define', () => {
    try {
      getValidate({
        $id: 'mockedSchema_type_unsupported'
      })(() => {})
    } catch (error) {
      expect(error).toMatchSnapshot()
    }
  })

  test('oneOf', () => {
    const schema = {
      $id: 'mockedSchema_oneOf',
      type: 'string',
      oneOf: [
        { type: 'string' },
        { type: 'number' }
      ]
    }
    const validate = getValidate(schema)

    expect(validate('expectedString')).toBe(true)
    expect(validate(333)).toBe(true)

    try {
      expect(validate({}))
    } catch (error) {
      expect(error).toMatchSnapshot('failed with unmatched oneOf')
    }
  })

  test('oneOf failed with wrong schema', () => {
    try {
      getValidate({
        $id: 'mockedSchema_oneOf_wrong1',
        type: 'string',
        oneOf: 'nonArray'
      })('string')
    } catch (error) {
      expect(error).toMatchSnapshot('wrong "oneOf" define')
    }
  })

  test('format hostname', () => {
    const schema = {
      $id: 'mockedSchema_format_hostname',
      type: 'string',
      format: 'hostname'
    }
    const validate = getValidate(schema)

    expect(validate('mocked-host.name.com')).toBe(true)

    try {
      expect(validate('unsupported hostname'))
    } catch (error) {
      expect(error).toMatchSnapshot('failed')
    }
  })

  test('format ipv4', () => {
    const schema = {
      $id: 'mockedSchema_format_ipv4',
      type: 'string',
      format: 'ipv4'
    }
    const validate = getValidate(schema)

    expect(validate('127.0.0.1')).toBe(true)

    try {
      expect(validate('unsupported ipv4'))
    } catch (error) {
      expect(error).toMatchSnapshot('failed')
    }
  })

  test('format ipv6', () => {
    const schema = {
      $id: 'mockedSchema_format_ipv6',
      type: 'string',
      format: 'ipv6'
    }
    const validate = getValidate(schema)

    expect(validate('::1')).toBe(true)

    try {
      expect(validate('unsupported ipv6'))
    } catch (error) {
      expect(error).toMatchSnapshot('failed')
    }
  })

  test('format uri', () => {
    const schema = {
      $id: 'mockedSchema_format_uri',
      type: 'string',
      format: 'uri'
    }
    const validate = getValidate(schema)

    expect(validate('mocked-protocol://mocked/path')).toBe(true)

    try {
      expect(validate('unsupported uri'))
    } catch (error) {
      expect(error).toMatchSnapshot('failed')
    }
  })

  test('format unsupported', () => {
    try {
      getValidate({
        $id: 'mockedSchema_format_unsupported',
        type: 'string',
        format: 'unsupported'
      })(() => {})
    } catch (error) {
      expect(error).toMatchSnapshot()
    }
  })
})
