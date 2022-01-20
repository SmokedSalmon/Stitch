import * as extendedMatchers from 'jest-extended';
require('regenerator-runtime/runtime');

jest.setTimeout(10000);
// Additional expect matchers to perform comprehensive unit tests
expect.extend(extendedMatchers);
