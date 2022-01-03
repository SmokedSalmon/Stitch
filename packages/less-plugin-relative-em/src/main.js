import RemWarning from './RemWarning'

function primeFactors (n) {
  const factors = []
  let divisor = 2

  while (n >= 2) {
    if (n % divisor === 0) {
      factors.push(divisor)
      n = n / divisor
    } else {
      divisor++
    }
  }
  return factors
}

export default {
  install (less, pluginManager, functions) {
    pluginManager.addVisitor(new RemWarning(less))

    functions.add('relativeEm', ({ value }, { value: baseFontSize }, { value: parentFontSize } = {}) => {
      if (parentFontSize > 0) {
        baseFontSize = parentFontSize
      }

      const valuePrimeFactors = primeFactors(value)

      const baseFontSizePrimeFactors = primeFactors(baseFontSize)

      // after fraction reduce, there are only 2 and 5 in the prime factors of the numerator and denominator, which can be expressed as a non-circulating decimal
      if (
        Array.from(
          // reduction
          new Set([
            ...valuePrimeFactors.filter(num => !baseFontSizePrimeFactors.includes(num)),
            ...baseFontSizePrimeFactors.filter(num => !valuePrimeFactors.includes(num))
          ])
        ).every(num => num === 2 || num === 5)
      ) {
        return less.dimension(value / baseFontSize, 'em')
      }

      return `calc(${value} / ${baseFontSize} * 1em)`
    })
  }
}
