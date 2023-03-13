# Stack Action

GitHub Action to build, test, and lint a stack-based Haskell project.

## Usage

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: freckle/stack-action@v4
```

**NOTE**: as of version 4, this action automatically handles caching. You do not
need to use a separate `stack-cache-action` step any more.

## Inputs

- `working-directory`: working directory for all `run` steps.

  Useful for a multi-project repository.

- `stack-yaml`: path to use instead of `stack.yaml`.

  Expected to be relative to `working-directory`.

- `fast`: pass `--fast` to stack build/test (default `true`).

  You probably want to disable `--fast` if building executables for
  deployment. Assuming that happens on your default branch, you could
  do:

  ```yaml
  with:
    fast: ${{ github.ref != 'refs/heads/main' }}
  ```

- `pedantic`: pass `--pedantic` to stack build/test (default `true`).

- `test`: whether tests should be executed (default `true`).

- `stack-arguments`: additional arguments for stack invocation.

  Default is none, except if `stack-yaml` is the string `"stack-nightly.yaml"`,
  in which case `--resolver nightly` will be used.

- `cache-prefix`: prefix applied to all cache keys. This can be any value you
  like, but teams often use `v{N} and bump it to `v{N+1}` when/if they need to
  explicitly bust caches. The default is empty.

## Outputs

`compiler` (e.g. `ghc-9.2.5`) and `compiler-version` (e.g. `9.2.5`) are set from
the output of `stack query compiler actual`. This can be useful when downstream
actions depend on it:

```yaml
- id: stack
  uses: freckle/stack-action@v4
- uses: freckle/weeder-action@v2
  with:
    ghc-version: ${{ steps.stack.outputs.compiler-version }}
```

Every value from `stack path` is set as itself as an output. This can be useful,
for example, to upload executables or coverage reports:

```yaml
- id: stack
  uses: freckle/stack-action@v4
  with:
    stack-arguments: --copy-bins --coverage

- uses: actions/upload-artifact@v2
  with:
    name: executable
    path: ${{ steps.stack.outputs.local-bin-path }}/my-exe

- uses: actions/upload-artifact@v2
  with:
    name: coverage-report
    path: ${{ steps.stack.outputs.local-hpc-root }}/index.html
```

## HLint & Weeder

Previous versions of this Action ran HLint and Weeder for you. We recommend
doing that as separate actions now, so those options have been removed.

Here is an example of running separate Actions:

```yaml
jobs:
  test:
    # ...
    steps:
      - uses: actions/checkout@v3
      - id: stack
        uses: freckle/stack-action@v4

      # Weeder requires running in the same Job (to access .hie artifacts)
      - uses: freckle/weeder-action@v2
        with:
          ghc-version: ${{ steps.stack.outputs.compiler-version }}

  # HLint can be a distinct Job, possibly limited to changed files
  hlint:
    # ...
    steps:
      - uses: actions/checkout@v3
      - uses: haskell/actions/hlint-setup@v1
      - uses: haskell/actions/hlint-run@v2
```

---

[LICENSE](./LICENSE)
