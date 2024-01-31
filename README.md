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

## Notable Changes in v3

Previous versions of this Action ran HLint and Weeder for you. We recommend
doing that as separate actions now, so, as of `v3, those options have been
removed.

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

<!-- action-docs-inputs action="action.yml" -->
## Inputs

| name | description | required | default |
| --- | --- | --- | --- |
| `working-directory` | <p>Working directory for run commands</p> | `true` | `.` |
| `stack-yaml` | <p>Override stack.yaml, relative to working-directory</p> | `true` | `stack.yaml` |
| `test` | <p>Whether to run tests</p> | `false` | `true` |
| `stack-arguments` | <p>Additional arguments for all top-level <code>stack</code> command invocations.</p> | `true` | `--no-terminal` |
| `stack-query-arguments` | <p>Additional arguments in <code>stack query</code> invocations.</p> | `true` | `""` |
| `stack-path-arguments` | <p>Additional arguments in <code>stack path</code> invocations.</p> | `true` | `""` |
| `stack-setup-arguments` | <p>Additional arguments in <code>stack setup</code> invocations.</p> | `true` | `""` |
| `stack-build-arguments` | <p>Additional arguments for all <code>stack build</code> invocations.</p> | `true` | `--fast --pedantic` |
| `stack-build-arguments-dependencies` | <p>Additional arguments passed after <code>stack-build-arguments</code> in <code>stack build</code> invocations on the <code>Dependencies</code> step.</p> | `true` | `""` |
| `stack-build-arguments-build` | <p>Additional arguments passed after <code>stack-build-arguments</code> in <code>stack build</code> invocations on the <code>Build</code> step."</p> | `true` | `""` |
| `stack-build-arguments-test` | <p>Additional arguments passed after <code>stack-build-arguments</code> in <code>stack build</code> invocations on the <code>Test</code> step."</p> | `true` | `""` |
| `cache-prefix` | <p>Prefix applied to all cache keys. This can be any value you like, but teams often use <code>v{N}</code> and bump it to <code>v{N+1}</code> when/if they need to explicitly bust caches.</p> | `true` | `""` |
| `cache-save-always` | <p>Save artifacts to the cache even if the build fails. This may speed up builds in subsequent runs at the expense of slightly-longer builds when a full cache-hit occurs. Since <code>@v4.2.0</code></p> | `false` | `false` |
<!-- action-docs-inputs action="action.yml" -->

<!-- action-docs-outputs action="action.yml" -->
## Outputs

| name | description |
| --- | --- |
| `compiler` | <p>compiler.actual value from stack query</p> |
| `compiler-version` | <p>The GHC version part of compiler</p> |
| `snapshot-doc-root` | <p>snapshot-doc-root value from stack path</p> |
| `local-doc-root` | <p>local-doc-root value from stack path</p> |
| `local-hoogle-root` | <p>local-hoogle-root value from stack path</p> |
| `stack-root` | <p>stack-root value from stack path</p> |
| `project-root` | <p>project-root value from stack path</p> |
| `config-location` | <p>config-location value from stack path</p> |
| `bin-path` | <p>bin-path value from stack path</p> |
| `programs` | <p>programs value from stack path</p> |
| `compiler-exe` | <p>compiler-exe value from stack path</p> |
| `compiler-bin` | <p>compiler-bin value from stack path</p> |
| `compiler-tools-bin` | <p>compiler-tools-bin value from stack path</p> |
| `local-bin` | <p>local-bin value from stack path</p> |
| `extra-include-dirs` | <p>extra-include-dirs value from stack path</p> |
| `extra-library-dirs` | <p>extra-library-dirs value from stack path</p> |
| `snapshot-pkg-db` | <p>snapshot-pkg-db value from stack path</p> |
| `local-pkg-db` | <p>local-pkg-db value from stack path</p> |
| `global-pkg-db` | <p>global-pkg-db value from stack path</p> |
| `ghc-package-path` | <p>ghc-package-path value from stack path</p> |
| `snapshot-install-root` | <p>snapshot-install-root value from stack path</p> |
| `local-install-root` | <p>local-install-root value from stack path</p> |
| `dist-dir` | <p>dist-dir value from stack path</p> |
| `local-hpc-root` | <p>local-hpc-root value from stack path</p> |
<!-- action-docs-outputs action="action.yml" -->

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
        uses: freckle/stack-action/generate-matrix@v5
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
This has been available since version 4 of this action.

---

[LICENSE](./LICENSE)
