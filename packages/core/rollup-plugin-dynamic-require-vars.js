/**
 * Modified from @rollup/plugin-dynamic-import-vars@1.4.1
 */
import path from 'path';
import { walk } from 'estree-walker';
import MagicString from 'magic-string';
import globby from 'globby';
import { createFilter } from '@rollup/pluginutils';

class VariableDynamicRequireError extends Error {}

/* eslint-disable-next-line no-template-curly-in-string */
const example = 'For example: require(`./foo/${bar}.js`).';

function sanitizeString(str) {
  if (str.includes('*')) {
    throw new VariableDynamicRequireError('A dynamic require cannot contain * characters.');
  }
  return str;
}

function templateLiteralToGlob(node) {
  let glob = '';

  for (let i = 0; i < node.quasis.length; i += 1) {
    glob += sanitizeString(node.quasis[i].value.raw);
    if (node.expressions[i]) {
      glob += expressionToGlob(node.expressions[i]);
    }
  }

  return glob;
}

function callExpressionToGlob(node) {
  const { callee } = node;
  if (
    callee.type === 'MemberExpression' &&
    callee.property.type === 'Identifier' &&
    callee.property.name === 'concat'
  ) {
    return `${expressionToGlob(callee.object)}${node.arguments.map(expressionToGlob).join('')}`;
  }
  return '*';
}

function binaryExpressionToGlob(node) {
  if (node.operator !== '+') {
    throw new VariableDynamicRequireError(`${node.operator} operator is not supported.`);
  }

  return `${expressionToGlob(node.left)}${expressionToGlob(node.right)}`;
}

function expressionToGlob(node) {
  switch (node.type) {
    case 'TemplateLiteral':
      return templateLiteralToGlob(node);
    case 'CallExpression':
      return callExpressionToGlob(node);
    case 'BinaryExpression':
      return binaryExpressionToGlob(node);
    case 'Literal': {
      return sanitizeString(node.value);
    }
    default:
      return '*';
  }
}

function DynamicRequireToGlob(node, sourceString) {
  let glob = expressionToGlob(node);
  if (!glob.includes('*') || glob.startsWith('data:')) {
    return null;
  }
  glob = glob.replace(/\*\*/g, '*');

  if (glob.startsWith('*')) {
    throw new VariableDynamicRequireError(
      `invalid require "${sourceString}". It cannot be statically analyzed. Variable dynamic requires must start with ./ and be limited to a specific directory. ${example}`
    );
  }

  if (glob.startsWith('/')) {
    throw new VariableDynamicRequireError(
      `invalid require "${sourceString}". Variable absolute requires are not supported, requires must start with ./ in the static part of the require. ${example}`
    );
  }

  if (!glob.startsWith('./') && !glob.startsWith('../')) {
    throw new VariableDynamicRequireError(
      `invalid require "${sourceString}". Variable bare requires are not supported, requires must start with ./ in the static part of the require. ${example}`
    );
  }

  // Disallow ./*.ext
  const ownDirectoryStarExtension = /^\.\/\*\.[\w]+$/;
  if (ownDirectoryStarExtension.test(glob)) {
    throw new VariableDynamicRequireError(
      `${
      `invalid require "${sourceString}". Variable requires cannot require their own directory, ` +
      'place requires in a separate directory or make the require filename more specific. '
        }${example}`
    );
  }

  if (path.extname(glob) === '') {
    throw new VariableDynamicRequireError(
      `invalid require "${sourceString}". A file extension must be included in the static part of the require. ${example}`
    );
  }

  return glob;
}

function DynamicRequireVariables({ include, exclude, warnOnError } = {}) {
  const filter = createFilter(include, exclude);

  return {
    name: 'rollup-plugin-dynamic-require-variables',

    transform(code, id) {
      if (!filter(id)) {
        return null;
      }

      const parsed = this.parse(code);

      let DynamicRequireIndex = -1;
      let ms;

      walk(parsed, {
        enter: (node, ...args) => {
          if (
            node.type === 'Identifier' && node.name === 'require' &&
            args && args[0].type === 'CallExpression' &&
            // require() call is dynamic require
            args[0].arguments[0].type === 'CallExpression'
          ) {
            // console.log(code.substring(node.start, args[0].end))
          } else {
            return;
          }
          DynamicRequireIndex += 1;

          try {
            // see if this is a variable dynamic require, and generate a glob expression
            const glob = DynamicRequireToGlob(args[0].arguments[0], code.substring(node.start, args[0].end));

            if (!glob) {
              // this was not a variable dynamic require
              return;
            }

            // execute the glob
            const result = globby.sync(glob, { cwd: path.dirname(id) });
            const paths = result.map((r) =>
              r.startsWith('./') || r.startsWith('../') ? r : `./${r}`
            );

            // create magic string if it wasn't created already
            ms = ms || new MagicString(code);
            // unpack variable dynamic require into a function with require statements per file, rollup
            // will turn these into chunks automatically
            ms.prepend(
              `${paths.map((p) => `import * as ${p.replace(/[./]/g, '_')} from '${p}';`).join('\n')}\n\n
function __variableDynamicRequireRuntime${DynamicRequireIndex}__(path) {
  switch (path) {
${paths.map((p) => `    case '${p}': return ${p.replace(/[./]/g, '_')};`).join('\n')}
${`    default:\n`}   }
 }\n\n`
            );
            // call the runtime function instead of doing a dynamic require, the require specifier will
            // be evaluated at runtime and the correct require will be returned by the injected function
            ms.overwrite(
              node.start,
              node.start + 'require'.length,
              `__variableDynamicRequireRuntime${DynamicRequireIndex}__`
            );
          } catch (error) {
            if (error instanceof VariableDynamicRequireError) {
              // TODO: line number
              if (warnOnError) {
                this.warn(error);
              } else {
                this.error(error);
              }
            } else {
              this.error(error);
            }
          }
        }
      });

      if (ms && DynamicRequireIndex !== -1) {
        return {
          code: ms.toString(),
          map: ms.generateMap({
            file: id,
            includeContent: true,
            hires: true
          })
        };
      }
      return null;
    }
  };
}

export default DynamicRequireVariables;
export { VariableDynamicRequireError, DynamicRequireToGlob };
