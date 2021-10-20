# Stack Action

GitHub Action to build, test, and lint a stack-based Haskell project.

## Usage

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: freckle/stack-action@main
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

- `hlint`: whether to run install and `hlint` (default `true`)

- `hlint-version`: install a specific version of HLint (default latest)

- `hlint-arguments`: arguments to pass to `hlint` (default `.`)

- `weeder`: whether to run install and `weeder` (default `true`)

- `weeder-version`: install a specific version of Weeder (default latest)

- `weeder-arguments`: arguments to pass to `weeder` (default none)

---

[LICENSE](./LICENSE)
