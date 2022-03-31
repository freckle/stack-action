# Stack Action

GitHub Action to build, test, and lint a stack-based Haskell project.

## Usage

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: freckle/stack-action@v3
```

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

- `stack-arguments`: additional arguments for stack invocation.

  Default is none, except if `stack-yaml` is the string `"stack-nightly.yaml"`,
  in which case `--resolver nightly` will be used.

## Outputs

Every value from `stack path` is set as an output. This can be useful, for
example, to upload executables or coverage reports:

```yaml
- id: stack
  uses: freckle/stack-action@v3
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
      - uses: actions/checkout@v2
      - uses: freckle/stack-cache-action@v1
      - uses: freckle/stack-action@v3

      # Weeder needs compilation artifacts, so it must still be the same Job
      - uses: freckle/weeder-action@v1

  # But HLint can be a distinct Job, which affords more flexibility
  hlint:
    # ...
    steps:
      - uses: actions/checkout@v2
      - uses: rwe/actions-hlint-setup@v1
      - uses: rwe/actions-hlint-run@v2
```

---

[LICENSE](./LICENSE)
