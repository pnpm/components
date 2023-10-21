import { groupStart } from './group'

const CI = {
  isCI: true,
  GITHUB_ACTIONS: false,
  GITLAB: false,
  TRAVIS: false,
  AZURE_PIPELINES: false,
  BUILDKITE: false,
};

jest.mock('ci-info', () => CI)

const originalWrite = process.stdout.write.bind(process.stdout)

beforeEach(() => {
  process.stdout.write = jest.fn()
})

afterEach(() => {
  CI.GITHUB_ACTIONS = false
  CI.GITLAB = false
  CI.TRAVIS = false
  CI.AZURE_PIPELINES = false
  CI.BUILDKITE = false
  process.stdout.write = originalWrite
})

test('groups for GitHub', () => {
  CI.GITHUB_ACTIONS = true
  const groupEnd = groupStart('foo')!
  expect(process.stdout.write).toHaveBeenCalledWith('::group::foo\r\n');
  expect(process.stdout.write).toHaveBeenCalledTimes(1)
  groupEnd()
  expect(process.stdout.write).toHaveBeenCalledWith('::endgroup::\r\n')
  expect(process.stdout.write).toHaveBeenCalledTimes(2)
})

test('groups for GitLab', () => {
  CI.GITLAB = true
  const DATE_NOW_MOCK = new Date('2023-10-20T12:00:00Z').getTime();
  const timestamp = Math.floor(DATE_NOW_MOCK / 1000)
  jest.spyOn(Date, 'now').mockImplementation(() => DATE_NOW_MOCK);
  const groupEnd = groupStart('foo')!
  expect(process.stdout.write).toHaveBeenCalledWith(`section_start:${timestamp}:1\\r\\e[0Kfoo\r\n`);
  expect(process.stdout.write).toHaveBeenCalledTimes(1)
  groupEnd()
  expect(process.stdout.write).toHaveBeenCalledWith(`section_end:${timestamp}:1\\r\\e[0K`)
  expect(process.stdout.write).toHaveBeenCalledTimes(2)
})

test('groups for Travis', () => {
  CI.TRAVIS = true
  const groupEnd = groupStart('foo')!
  expect(process.stdout.write).toHaveBeenCalledWith('travis_fold:start:foo\r\n');
  expect(process.stdout.write).toHaveBeenCalledTimes(1)
  groupEnd()
  expect(process.stdout.write).toHaveBeenCalledWith('travis_fold:end:foo\r\n')
  expect(process.stdout.write).toHaveBeenCalledTimes(2)
})

test('groups for Azure', () => {
  CI.AZURE_PIPELINES = true
  const groupEnd = groupStart('foo')!
  expect(process.stdout.write).toHaveBeenCalledWith('##[group]foo\r\n');
  expect(process.stdout.write).toHaveBeenCalledTimes(1)
  groupEnd()
  expect(process.stdout.write).toHaveBeenCalledWith('##[endgroup]\r\n')
  expect(process.stdout.write).toHaveBeenCalledTimes(2)
})

test('groups for Buildkite', () => {
  CI.BUILDKITE = true
  const groupEnd = groupStart('foo')!
  expect(process.stdout.write).toHaveBeenCalledWith('--- foo\r\n');
  expect(process.stdout.write).toHaveBeenCalledTimes(1)
  groupEnd()
  expect(process.stdout.write).toHaveBeenCalledWith('\r\n')
  expect(process.stdout.write).toHaveBeenCalledTimes(2)
})
