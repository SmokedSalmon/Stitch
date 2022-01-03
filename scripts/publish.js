/**
 * Attention: ALWAYS ensure sufficient Quality Assurance measures such as Linting & Unit tests are PASSED before Publishing new release to Registries
 * Since Alpha phase, this publish script is run as the final step under Continuous Integration flow such as Jenkins.
 * Linting, Unit tests and build steps are performed before it.
 */
const { execSync } = require('child_process')

const args = process.argv.slice(2)

const packageArg = args.find(item => /--package=(?:[^ ]+)/.test(item)).split('=')[1]

const run = (command, { doExit = true } = {}) => {
  let stdout
  command = `cd packages/${packageArg} && ${command}`

  try {
    console.log(`> ${command}`)
    stdout = execSync(command)
  } catch (error) {
    console.log(error.stdout.toString())

    if (doExit) process.exit(1)
  }

  if (stdout) console.log(stdout.toString())
}

/* Publish to registry */
// publish to npm-hsbc-internal registry, most HSBC applications such as HSBCnet, CMB, trade, GTRF, entitlement UI and more, use it
run('npm publish --registry https://dsnexus.uk.hibm.hsbc:8081/nexus/content/repositories/npm-hsbc-internal/', { doExit: false })
// publish to npm-hsbc-internal_digital registry, DBB channel applications use it
run('npm publish --registry https://nexus-digital.systems.uk.hsbc:8081/nexus/content/repositories/npm-hsbc-internal_digital/', { doExit: false })

// publish to public-npm-registry_iq, usage unknown,
// run('npm publish --registry https://dsnexus.uk.hibm.hsbc:8081/nexus/content/repositories/public-npm-registry_iq/', { doExit: false })

process.exit(0)
