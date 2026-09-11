import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'

import {GenHIE} from './hie.js'
import type {ExecDelegate} from './stack-cli.js'
import {StackCLI} from './stack-cli.js'

const tmpDirs: string[] = []

function tmpHieYaml(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'stack-action-hie-'))
  tmpDirs.push(dir)
  const file = path.join(dir, 'hie.yaml')
  fs.writeFileSync(file, 'cradle:\n')
  return file
}

function missingHieYaml(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'stack-action-hie-'))
  tmpDirs.push(dir)
  return path.join(dir, 'hie.yaml')
}

// StackCLI is constructed around an injected ExecDelegate so GenHIE exercises
// the real command-building path
function stackWith(exec: ExecDelegate['exec']): StackCLI {
  return new StackCLI([], false, {exec: vi.fn(exec)})
}

afterEach(() => {
  for (const dir of tmpDirs.splice(0)) {
    fs.rmSync(dir, {recursive: true, force: true})
  }
})

describe(GenHIE.name, () => {
  test('defaults to hie.yaml', () => {
    expect(new GenHIE(stackWith(() => Promise.resolve(0))).path).toEqual('hie.yaml')
  })

  test('does nothing when the file does not exist', async () => {
    const exec = vi.fn(() => Promise.resolve(0))
    const genHIE = new GenHIE(stackWith(exec), missingHieYaml())

    await genHIE.install()
    await genHIE.generate()

    expect(exec).not.toHaveBeenCalled()
  })

  test('installs implicit-hie and regenerates the file when it exists', async () => {
    const file = tmpHieYaml()
    const commands: string[][] = []

    const genHIE = new GenHIE(
      stackWith((command, args, options) => {
        commands.push([command].concat(args))

        if (args.includes('gen-hie')) {
          options?.listeners?.stdout?.(Buffer.from('cradle:\n  stack:\n'))
        }

        return Promise.resolve(0)
      }),
      file
    )

    await genHIE.install()
    await genHIE.generate()

    expect(commands).toEqual([
      ['stack', 'install', '--copy-compiler-tool', 'implicit-hie'],
      ['stack', 'exec', '--', 'which', 'gen-hie'],
      ['stack', 'exec', '--', 'gen-hie', '--stack']
    ])
    expect(fs.readFileSync(file, 'utf-8')).toEqual('cradle:\n  stack:\n')
  })

  test('warns rather than failing when implicit-hie cannot be installed', async () => {
    const genHIE = new GenHIE(
      stackWith(() => Promise.reject(new Error('Boom'))),
      tmpHieYaml()
    )

    await expect(genHIE.install()).resolves.toBeUndefined()
  })

  test('skips generating when gen-hie is not on PATH', async () => {
    const file = tmpHieYaml()

    const genHIE = new GenHIE(
      stackWith(() => Promise.resolve(1)),
      file
    )

    await genHIE.generate()

    expect(fs.readFileSync(file, 'utf-8')).toEqual('cradle:\n')
  })
})
