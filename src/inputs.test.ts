import {afterEach, beforeEach, describe, expect, test} from 'vitest'

import {getInputs} from './inputs.js'

// core.getInput() reads INPUT_{NAME}; action.yml defaults are not applied for
// us, so set the ones action.yml declares a default for.
const defaults: Record<string, string> = {
  INPUT_TEST: 'true',
  INPUT_COLOR: 'true',
  'INPUT_CACHE-SAVE-ALWAYS': 'false',
  'INPUT_INSTALL-STACK': 'true',
  'INPUT_UPGRADE-STACK': 'true',
  'INPUT_ON-DIRTY-FILES': 'warn'
}

function setInputs(inputs: Record<string, string>): void {
  for (const [k, v] of Object.entries({...defaults, ...inputs})) {
    process.env[k] = v
  }
}

describe(getInputs.name, () => {
  const saved = {...process.env}

  beforeEach(() => {
    for (const k of Object.keys(process.env)) {
      if (k.startsWith('INPUT_')) {
        delete process.env[k]
      }
    }
  })

  afterEach(() => {
    process.env = {...saved}
  })

  test('reads action.yml defaults', () => {
    setInputs({'INPUT_STACK-BUILD-ARGUMENTS': '--fast --pedantic'})

    expect(getInputs()).toEqual({
      workingDirectory: null,
      test: true,
      color: true,
      stackArguments: [],
      stackSetupArguments: [],
      stackQueryArguments: [],
      stackBuildArgumentsDependencies: ['--fast', '--pedantic'],
      stackBuildArgumentsBuild: ['--fast', '--pedantic'],
      stackBuildArgumentsTest: ['--fast', '--pedantic'],
      cachePrefix: '',
      cacheSaveAlways: false,
      onDirtyFiles: 'warn',
      installStack: true,
      upgradeStack: true,
      compilerTools: [],
      stackYaml: null
    })
  })

  test('appends per-step build arguments after the shared ones', () => {
    setInputs({
      'INPUT_STACK-BUILD-ARGUMENTS': '--fast',
      'INPUT_STACK-BUILD-ARGUMENTS-DEPENDENCIES': '--jobs 1',
      'INPUT_STACK-BUILD-ARGUMENTS-BUILD': '--pedantic',
      'INPUT_STACK-BUILD-ARGUMENTS-TEST': '--ta=--color'
    })

    const inputs = getInputs()

    expect(inputs.stackBuildArgumentsDependencies).toEqual(['--fast', '--jobs', '1'])
    expect(inputs.stackBuildArgumentsBuild).toEqual(['--fast', '--pedantic'])
    expect(inputs.stackBuildArgumentsTest).toEqual(['--fast', '--ta=--color'])
  })

  test('splits multi-line arguments as shell words and expands the environment', () => {
    process.env.SOME_RESOLVER = 'lts-22.7'
    setInputs({
      'INPUT_STACK-ARGUMENTS': '--resolver $SOME_RESOLVER\n--system-ghc',
      'INPUT_COMPILER-TOOLS': 'implicit-hie\nhlint'
    })

    const inputs = getInputs()

    expect(inputs.stackArguments).toEqual(['--resolver', 'lts-22.7', '--system-ghc'])
    expect(inputs.compilerTools).toEqual(['implicit-hie', 'hlint'])
  })

  test('reads booleans, trims working-directory, and keeps deprecated stack-yaml', () => {
    setInputs({
      'INPUT_WORKING-DIRECTORY': '  example  ',
      INPUT_TEST: 'false',
      INPUT_COLOR: 'false',
      'INPUT_CACHE-SAVE-ALWAYS': 'true',
      'INPUT_INSTALL-STACK': 'false',
      'INPUT_UPGRADE-STACK': 'false',
      'INPUT_ON-DIRTY-FILES': 'error',
      'INPUT_CACHE-PREFIX': 'v3/',
      'INPUT_STACK-QUERY-ARGUMENTS': '--verbose',
      'INPUT_STACK-SETUP-ARGUMENTS': '--reinstall',
      'INPUT_STACK-YAML': 'stack-nightly.yaml'
    })

    const inputs = getInputs()

    expect(inputs.workingDirectory).toEqual('example')
    expect(inputs.test).toBe(false)
    expect(inputs.color).toBe(false)
    expect(inputs.cacheSaveAlways).toBe(true)
    expect(inputs.installStack).toBe(false)
    expect(inputs.upgradeStack).toBe(false)
    expect(inputs.onDirtyFiles).toEqual('error')
    expect(inputs.cachePrefix).toEqual('v3/')
    expect(inputs.stackQueryArguments).toEqual(['--verbose'])
    expect(inputs.stackSetupArguments).toEqual(['--reinstall'])
    expect(inputs.stackYaml).toEqual('stack-nightly.yaml')
  })

  test('rejects an invalid on-dirty-files', () => {
    setInputs({'INPUT_ON-DIRTY-FILES': 'explode'})

    expect(() => getInputs()).toThrow(/Invalid on-dirty-files/)
  })
})
