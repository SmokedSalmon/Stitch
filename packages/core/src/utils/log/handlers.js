const logHandlers = {
  debug: (stitchError) => {
    console.log(stitchError.value)
  },
  info: (stitchError) => {
    console.info(stitchError.value)
  },
  warn: (stitchError) => {
    console.warn(stitchError.value)
  },
  error: (stitchError) => {
    console.error(stitchError.value)
  },
  fatal: (stitchError) => {
    console.error(stitchError.value)
  }
}
export default logHandlers
