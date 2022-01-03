const WARNING_TITLE = 'WARNING: avoid static rem unit for support different base font-size.'

const createWarning = (content) => `body::before {
  background-color: rgba(0, 0, 0, 0.75);
  color: red !important;
  content: '${content}' !important;
  display: block !important;
  font-family: Monaco, "Courier New", monospace;
  font-size: large;
  left: 0 !important;
  opacity: 1 !important;
  position: absolute !important;
  top: 0 !important;
  visibility: visible !important;
  white-space: pre;
  width: 100%;
  z-index: 2147483647 !important;
}`

const getSelectorInfo = (elements = []) => {
  const selectors = []

  elements.forEach(item => selectors.push(item.value || ''))

  return `\\0009 at selector: ${selectors.join('')}`
}

const checkUnit = ({ numerator } = {}) => /^rem$/.test(numerator)

class RemWarning {
  constructor (less) {
    this._visitor = new less.visitors.Visitor(this)
    this._tree = less.tree

    this.isReplacing = true
  }

  run (root) {
    return this._visitor.visit(root)
  }

  visitRuleset (rulesetNode, visitArgs) {
    if (process.env.NODE_ENV !== 'development') return

    const { Node, Call } = this._tree
    const warningNode = new Node()
    const warning = [
      WARNING_TITLE
    ]

    const checkCalc = (value = {}) => {
      if (value.calc) {
        const output = {
          value: '',
          add (str) {
            this.value = this.value.concat(str)
          }
        };

        (new Call('calc', value.args)).genCSS({}, output)

        if (/rem/.test(output.value)) {
          return true
        }
      }

      return false
    }

    /* eslint-disable no-labels */
    checkRuleset:
    for (const rule of rulesetNode.rules) {
      const throwWarning = () => {
        warning.push(getSelectorInfo(rule.selectors[0].elements))
        warning.push(`\\0009 file: ${rule.selectors[0]._fileInfo.filename.replace(/\\/g, '\\\\')}`)
      }

      if (rule.selectors && rule.selectors.length && rule.rules && rule.rules.length) {
        for (const property of rule.rules) {
          const {
            value: propertyValue = {},
            value: { value } = {}
          } = property

          if (checkCalc(propertyValue)) {
            throwWarning()
            break checkRuleset
          }

          if (
            checkUnit(propertyValue.unit) ||
            (typeof value === 'string' && /rem/.test(value))
          ) {
            throwWarning()
            break checkRuleset
          }

          if (value instanceof Array) {
            if (value.some(valueNode => {
              if (valueNode.unit) {
                return checkUnit(valueNode.unit)
              }

              if (valueNode.calc) {
                return checkCalc(valueNode)
              }

              return /rem/.test(valueNode.value)
            })) {
              throwWarning()
              break checkRuleset
            }
          }
        }
      }
    }
    /* eslint-enable no-labels */

    if (warning.length > 1) {
      warningNode.value = createWarning(warning.join('\\a'))
      rulesetNode.rules.push(warningNode)
    }
  }
}

export default RemWarning
