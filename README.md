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

- `stack-arguments`: additional arguments for stack invocation.

- `hlint`: whether to run `hlint` (default to `true`)

- `weeder`: whether to run `weeder` (default to `true`)

---

[LICENSE](./LICENSE)
