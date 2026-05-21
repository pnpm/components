import CI, { isCI } from 'ci-info'

let id = 0

export function groupStart (groupName: string) {
  if (!isCI) return undefined
  const labels = getLabels(groupName)
  if (labels) {
    process.stdout.write(labels.start)
    return () => {
      process.stdout.write(labels.end)
    }
  }
  return undefined
}

function getLabels (groupName: string) {
  if (CI.GITHUB_ACTIONS) {
    return {
      start: `::group::${groupName}\r\n`,
      end: '::endgroup::\r\n',
    }
  } else if (CI.GITLAB) {
    id++
    return {
      start: `\x1b[0Ksection_start:${Math.floor(Date.now() / 1000)}:${id}\r\x1b[0K${groupName}\n`,
      end: `\x1b[0Ksection_end:${Math.floor(Date.now() / 1000)}:${id}\r\x1b[0K\n`,
    }
  } else if (CI.TRAVIS) {
    return {
      start: `travis_fold:start:${groupName}\r\n`,
      end: `travis_fold:end:${groupName}\r\n`,
    }
  } else if (CI.AZURE_PIPELINES) {
    return {
      start: `##[group]${groupName}\r\n`,
      end: '##[endgroup]\r\n',
    }
  } else if (CI.BUILDKITE) {
    return {
      start: `--- ${groupName}\r\n`,
      end: '\r\n',
    }
  }
  return null
}

