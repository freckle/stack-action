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

---

[LICENSE](./LICENSE)
