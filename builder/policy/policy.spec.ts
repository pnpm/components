import { createAllowBuildFunction } from './policy'

it('should neverBuiltDependencies', () => {
  const allowBuild = createAllowBuildFunction({
    neverBuiltDependencies: ['foo'],
  })
  expect(allowBuild('foo')).toBeFalsy()
  expect(allowBuild('bar')).toBeTruthy()
});

it('should onlyBuiltDependencies', () => {
  const allowBuild = createAllowBuildFunction({
    onlyBuiltDependencies: ['foo'],
  })
  expect(allowBuild('foo')).toBeTruthy()
  expect(allowBuild('bar')).toBeFalsy()
});

it('should return undefined if no policy is set', () => {
  expect(createAllowBuildFunction({})).toBeUndefined()
})
