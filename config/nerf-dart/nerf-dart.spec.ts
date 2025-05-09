import { nerfDart } from './nerf-dart'

test.each([
  ['//registry.npmjs.org/', [
    'https://registry.npmjs.org',
    'https://registry.npmjs.org/package-name',
    'https://registry.npmjs.org/package-name?write=true',
    'https://registry.npmjs.org/@scope%2fpackage-name',
    'https://registry.npmjs.org/@scope%2fpackage-name?write=true',
    'https://username:password@registry.npmjs.org/package-name?write=true',
    'https://registry.npmjs.org/#hash',
    'https://registry.npmjs.org/?write=true#hash',
    'https://registry.npmjs.org/package-name?write=true#hash',
    'https://registry.npmjs.org/package-name#hash',
    'https://registry.npmjs.org/@scope%2fpackage-name?write=true#hash',
    'https://registry.npmjs.org/@scope%2fpackage-name#hash',
  ]],
  ['//my-couch:5984/registry/_design/app/rewrite/', [
    'https://my-couch:5984/registry/_design/app/rewrite/',
    'https://my-couch:5984/registry/_design/app/rewrite/package-name',
    'https://my-couch:5984/registry/_design/app/rewrite/package-name?write=true',
    'https://my-couch:5984/registry/_design/app/rewrite/@scope%2fpackage-name',
    'https://my-couch:5984/registry/_design/app/rewrite/@scope%2fpackage-name?write=true',
    'https://username:password@my-couch:5984/registry/_design/app/rewrite/package-name?write=true',
    'https://my-couch:5984/registry/_design/app/rewrite/#hash',
    'https://my-couch:5984/registry/_design/app/rewrite/?write=true#hash',
    'https://my-couch:5984/registry/_design/app/rewrite/package-name?write=true#hash',
    'https://my-couch:5984/registry/_design/app/rewrite/package-name#hash',
    'https://my-couch:5984/registry/_design/app/rewrite/@scope%2fpackage-name?write=true#hash',
    'https://my-couch:5984/registry/_design/app/rewrite/@scope%2fpackage-name#hash',
  ]],
])('nerfDart', (dart, tests) => {
  expect.assertions(tests.length)
  for (const url of tests) {
    expect(nerfDart(url)).toBe(dart)
  }
})

test('nerfDart to throw', () => {
  expect(() => nerfDart('not a valid url')).toThrow()
})
