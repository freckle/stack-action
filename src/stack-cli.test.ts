import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import {ExecOptions} from '@actions/exec'
import {afterEach, describe, expect, test, vi} from 'vitest'

import {ExecDelegate, StackCLI} from './stack-cli.js'

const exec: ExecDelegate = {
  exec: vi.fn((_command: string, _args: string[], _options?: ExecOptions) => Promise.resolve(0))
}

// An ExecDelegate that feeds `stdout` to the caller's listener, as @actions/exec
// does for a real command
function execReading(stdout: string, ec = 0): ExecDelegate {
  return {
    exec: vi.fn((_command: string, _args: string[], options?: ExecOptions) => {
      options?.listeners?.stdout?.(Buffer.from(stdout))
      return Promise.resolve(ec)
    })
  }
}

describe(StackCLI.name, () => {
  test('Respects --resolver given', async () => {
    const stackCLI = new StackCLI(['--resolver', 'lts'], false, exec)

    await stackCLI.setup([])

    expect(exec.exec).toHaveBeenCalledWith(
      'stack',
      ['--resolver', 'lts', 'setup'],
      undefined // ExecOptions
    )
  })

  test('Adds --resolver nightly', async () => {
    const stackCLI = new StackCLI(['--stack-yaml', 'sub/stack-nightly.yaml'], false, exec)

    await stackCLI.setup([])

    expect(exec.exec).toHaveBeenCalledWith(
      'stack',
      ['--stack-yaml', 'sub/stack-nightly.yaml', '--resolver', 'nightly', 'setup'],
      undefined // ExecOptions
    )
  })

  test("Doesn't add --resolver nightly if given", async () => {
    const stackCLI = new StackCLI(
      ['--stack-yaml', 'sub/stack-nightly.yaml', '--resolver', 'nightly-20240201'],
      false,
      exec
    )

    await stackCLI.setup([])

    expect(exec.exec).toHaveBeenCalledWith(
      'stack',
      ['--stack-yaml', 'sub/stack-nightly.yaml', '--resolver', 'nightly-20240201', 'setup'],
      undefined // ExecOptions
    )
  })

  test('installCompilerTools', async () => {
    const stackCLI = new StackCLI([], false, exec)
    await stackCLI.installCompilerTools(['hlint', 'weeder'])

    expect(exec.exec).toHaveBeenCalledWith(
      'stack',
      ['install', '--copy-compiler-tool', 'hlint', 'weeder'],
      undefined
    )
  })

  test('installCompilerTools with empty arguments', async () => {
    const stackCLI = new StackCLI([], false, exec)
    await stackCLI.installCompilerTools([])

    expect(exec.exec).not.toHaveBeenCalled()
  })

  test('buildDependencies', async () => {
    const stackCLI = new StackCLI([], false, exec)

    await stackCLI.buildDependencies(['--coverage'])

    expect(exec.exec).toHaveBeenCalledWith(
      'stack',
      ['build', '--test', '--no-run-tests', '--dependencies-only', '--coverage'],
      undefined
    )
  })

  test('buildNoTest', async () => {
    const stackCLI = new StackCLI([], false, exec)

    await stackCLI.buildNoTest(['--coverage'])

    expect(exec.exec).toHaveBeenCalledWith(
      'stack',
      ['build', '--test', '--no-run-tests', '--coverage'],
      undefined
    )
  })

  test('buildTest', async () => {
    const stackCLI = new StackCLI([], false, exec)

    await stackCLI.buildTest(['--coverage'])

    expect(exec.exec).toHaveBeenCalledWith('stack', ['build', '--test', '--coverage'], undefined)
  })

  test('build', async () => {
    const stackCLI = new StackCLI([], false, exec)

    await stackCLI.build(['--coverage'])

    expect(exec.exec).toHaveBeenCalledWith('stack', ['build', '--coverage'], undefined)
  })

  test('config falls back to $STACK_YAML', () => {
    const saved = process.env.STACK_YAML
    process.env.STACK_YAML = 'stack-lts.yaml'

    try {
      expect(new StackCLI([], false, exec).config).toEqual('stack-lts.yaml')
    } finally {
      if (saved === undefined) {
        delete process.env.STACK_YAML
      } else {
        process.env.STACK_YAML = saved
      }
    }
  })

  test('installed', async () => {
    const stackCLI = new StackCLI([], false, exec)

    expect(await stackCLI.installed()).toBe(true)
    expect(exec.exec).toHaveBeenCalledWith('which', ['stack'], {
      silent: true,
      ignoreReturnCode: true
    })
  })

  test('installed is false on a non-zero exit', async () => {
    const missing: ExecDelegate = {exec: vi.fn(() => Promise.resolve(1))}

    expect(await new StackCLI([], false, missing).installed()).toBe(false)
  })

  test('upgrade does not pass global arguments', async () => {
    const stackCLI = new StackCLI(['--resolver', 'lts'], false, exec)

    await stackCLI.upgrade()

    expect(exec.exec).toHaveBeenCalledWith('stack', ['upgrade'])
  })

  describe('install', () => {
    const cwd = process.cwd()
    const dirs: string[] = []

    afterEach(() => {
      process.chdir(cwd)
      for (const dir of dirs.splice(0)) {
        fs.rmSync(dir, {recursive: true, force: true})
      }
    })

    test('downloads, runs, and removes the installer', async () => {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'stack-action-install-'))
      dirs.push(dir)
      process.chdir(dir)

      // Stand in for `curl -o install-stack.sh`
      const downloading: ExecDelegate = {
        exec: vi.fn((command: string) => {
          if (command === 'curl') {
            fs.writeFileSync('install-stack.sh', '#!/bin/sh\n')
          }
          return Promise.resolve(0)
        })
      }

      await new StackCLI([], false, downloading).install()

      expect(downloading.exec).toHaveBeenCalledWith('curl', [
        '-sSL',
        '-o',
        'install-stack.sh',
        'https://get.haskellstack.org'
      ])
      expect(downloading.exec).toHaveBeenCalledWith('sh', ['install-stack.sh'])
      expect(fs.existsSync(path.join(dir, 'install-stack.sh'))).toBe(false)
    })
  })

  test('which', async () => {
    const stackCLI = new StackCLI([], false, exec)

    expect(await stackCLI.which('gen-hie')).toBe(true)
    expect(exec.exec).toHaveBeenCalledWith('stack', ['exec', '--', 'which', 'gen-hie'], {
      ignoreReturnCode: true
    })
  })

  test('which is false on a non-zero exit', async () => {
    const missing: ExecDelegate = {exec: vi.fn(() => Promise.resolve(1))}

    expect(await new StackCLI([], false, missing).which('gen-hie')).toBe(false)
  })

  test('path parses `stack path` output', async () => {
    const reading = execReading('stack-root: /root/.stack\nbin-path: /usr/bin\n')

    expect(await new StackCLI([], false, reading).path()).toEqual({
      'stack-root': '/root/.stack',
      'bin-path': '/usr/bin'
    })
  })

  test('query parses `stack query` output', async () => {
    const reading = execReading('compiler:\n  actual: ghc-9.6.4\n  wanted: ghc-9.6.4\n')

    expect(await new StackCLI([], false, reading).query()).toEqual({
      compiler: {actual: 'ghc-9.6.4', wanted: 'ghc-9.6.4'}
    })
  })

  test('read hides the output it consumes unless debugging', async () => {
    const quiet = execReading('one\ntwo\n')
    expect(await new StackCLI([], false, quiet).read(['path'])).toEqual('one\ntwo\n')
    expect(vi.mocked(quiet.exec).mock.calls[0][2]?.outStream).toBeDefined()

    const debugging = execReading('one\ntwo\n')
    expect(await new StackCLI([], true, debugging).read(['path'])).toEqual('one\ntwo\n')
    expect(vi.mocked(debugging.exec).mock.calls[0][2]?.outStream).toBeUndefined()
  })
})
