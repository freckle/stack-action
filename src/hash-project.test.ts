import * as path from 'path'

vi.mock('@actions/glob', () => ({
  hashFiles: vi.fn((patterns: string) => Promise.resolve(`hash(${patterns})`))
}))

const {hashFiles} = await import('@actions/glob')
const {hashProject} = await import('./hash-project.js')

test('hashProject hashes the snapshot, package files, and sources separately', async () => {
  const hashes = await hashProject('stack-nightly.yaml')

  expect(hashes.snapshot).toEqual('hash(stack-nightly.yaml)')
  expect(hashes.package).toEqual(`hash(**${path.sep}package.yaml\n**${path.sep}*.cabal\n)`)
  expect(hashes.sources).toEqual(`hash(**\n!**${path.sep}.stack-work\n!.git\n)`)
  expect(hashFiles).toHaveBeenCalledTimes(3)
})
