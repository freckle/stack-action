# Stack Action

GitHub Action to build, test, and lint a stack-based Haskell project.

## Usage

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: freckle/stack-action@v5
```

## Notable Changes in v5

As of version 5, the single `stack-arguments` input has been broken up into
various, distinct `stack-[*-]arguments[-*]` inputs that are used in more
specific ways. See the _Inputs_ section, or `action.yml` for documentation of
the new options.

## Notable Changes in v4

As of version 4, this action automatically handles caching. You do not need to
use a separate `stack-cache-action` step any more.

## Inputs

All inputs are optional.

- `working-directory`: working directory for all `run` steps.

  Default is `.`. Useful for a multi-project repository.

- `stack-yaml`: path to use instead of `stack.yaml`.

  Default is `stack.yaml`. Expected to be relative to `working-directory`.

- `test`: whether tests should be executed

  Default `true`.

- `stack-arguments`: global arguments for **all** `stack` invocations

  Default is `--no-terminal --stack-yaml {stack-yaml}`, and if `stack-yaml` is
  the string `"stack-nightly.yaml"`, `--resolver nightly` will be added.

- `stack-build-arguments`: arguments for **all** `stack build` invocations

  Default is `--fast --pedantic`. If you are building executables, you probably
  want to override this to remove `--fast`.

- `stack-build-arguments-dependencies`: additional arguments for `stack build`
  in the _Dependencies_ step.

- `stack-build-arguments-build`: additional arguments for `stack build` in the
  _Build_ step.

- `stack-build-arguments-test`: additional arguments for `stack build` in the
  \_Test step.

- `stack-setup-arguments`: additional arguments for `stack setup`

  Default is none.

- `stack-query-arguments`: additional arguments for `stack query`

  Default is none.

- `stack-path-arguments`: additional arguments for `stack path`

  Default is none.

- `cache-prefix`: prefix applied to all cache keys. This can be any value you
  like, but teams often use `v{N}` and bump it to `v{N+1}` when/if they need to
  explicitly bust caches. The default is empty.

- `cache-save-always`: save artifacts to the cache even if the build fails.
  This may speed up builds in subsequent runs at the expense of slightly-longer
  builds when a full cache-hit occurs. (Since `@v4.2.0`)

## Outputs

`compiler` (e.g. `ghc-9.2.5`) and `compiler-version` (e.g. `9.2.5`) are set from
the output of `stack query compiler actual`. This can be useful when downstream
actions depend on it:

```yaml
- id: stack
  uses: freckle/stack-action@v5
- uses: freckle/weeder-action@v2
  with:
    ghc-version: ${{ steps.stack.outputs.compiler-version }}
```

Every value from `stack path` is set as itself as an output. This can be useful,
for example, to upload executables or coverage reports:

```yaml
- id: stack
  uses: freckle/stack-action@v5
  with:
    stack-build-arguments: --copy-bins --coverage

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
      - uses: actions/checkout@v4
      - id: stack
        uses: freckle/stack-action@v5

      # Weeder requires running in the same Job (to access .hie artifacts)
      - uses: freckle/weeder-action@v2
        with:
          ghc-version: ${{ steps.stack.outputs.compiler-version }}

  # HLint can be a distinct Job, possibly limited to changed files
  hlint:
    # ...
    steps:
      - uses: actions/checkout@v4
      - uses: haskell-actions/hlint-setup@v1
      - uses: haskell-actions/hlint-run@v2
```

## Generating a Build Matrix of `stack.yaml`s

The following automatically discovers all files matching `stack*.yaml` and runs
this action with each of them:

```yaml
jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - id: generate
        uses: freckle/stack-action/generate-matrix@v4
    outputs:
      stack-yamls: ${{ steps.generate.outputs.stack-yamls }}

  test:
    needs: generate
    strategy:
      matrix:
        stack-yaml: ${{ fromJSON(needs.generate.outputs.stack-yamls) }}
      fail-fast: false

    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: freckle/stack-action@v5
        with:
          stack-yaml: ${{ matrix.stack-yaml }}
```

See [generate-matrix/action.yml](./generate-matrix/action.yml) for more details.

---

[LICENSE](./LICENSE)
