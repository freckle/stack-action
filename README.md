# Stack Action

GitHub Action to build and test a stack-based Haskell project.

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

The `fast` and `pedantic` inputs were removed. Use a ternary operator (see
[Operators](https://docs.github.com/en/actions/learn-github-actions/expressions#operators))
to pass a flag conditionally. Example:

```yaml
stack-build-arguments: ${{ github.ref_name != 'main' && '--fast' || '' }} --pedantic
```

## Notable Changes in v4

As of version 4, this action automatically handles caching. You do not need to
use a separate `stack-cache-action` step any more.

## Notable Changes in v3

Previous versions of this Action ran HLint and Weeder for you. We recommend
doing that as separate actions now, so, as of `v3`, those options have been
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

| name                                 | description                                                                                                                                                                                                                                    | required | default             |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------- |
| `working-directory`                  | <p>Working directory for run commands</p>                                                                                                                                                                                                      | `false`  | `""`                |
| `test`                               | <p>Whether to run tests</p>                                                                                                                                                                                                                    | `false`  | `true`              |
| `stack-arguments`                    | <p>Additional arguments for all top-level <code>stack</code> command invocations.</p>                                                                                                                                                          | `false`  | `--no-terminal`     |
| `stack-query-arguments`              | <p>Additional arguments in <code>stack query</code> invocations.</p>                                                                                                                                                                           | `false`  | `""`                |
| `stack-path-arguments`               | <p>Additional arguments in <code>stack path</code> invocations.</p>                                                                                                                                                                            | `false`  | `""`                |
| `stack-setup-arguments`              | <p>Additional arguments in <code>stack setup</code> invocations.</p>                                                                                                                                                                           | `false`  | `""`                |
| `stack-build-arguments`              | <p>Additional arguments for all <code>stack build</code> invocations.</p>                                                                                                                                                                      | `false`  | `--fast --pedantic` |
| `stack-build-arguments-dependencies` | <p>Additional arguments passed after <code>stack-build-arguments</code> in <code>stack build</code> invocations on the <em>Dependencies</em> step.</p>                                                                                         | `false`  | `""`                |
| `stack-build-arguments-build`        | <p>Additional arguments passed after <code>stack-build-arguments</code> in <code>stack build</code> invocations on the <em>Build</em> step.</p>                                                                                                | `false`  | `""`                |
| `stack-build-arguments-test`         | <p>Additional arguments passed after <code>stack-build-arguments</code> in <code>stack build</code> invocations on the <em>Test</em> step.</p>                                                                                                 | `false`  | `""`                |
| `cache-prefix`                       | <p>Prefix applied to all cache keys. This can be any value you like, but teams often use <code>v{N}</code> and bump it to <code>v{N+1}</code> when/if they need to explicitly bust caches.</p>                                                 | `false`  | `""`                |
| `cache-save-always`                  | <p>Save artifacts to the cache even if the build fails. This may speed up builds in subsequent runs at the expense of slightly-longer builds when a full cache-hit occurs. Since <code>@v4.2.0</code>.</p>                                     | `false`  | `false`             |
| `on-dirty-files`                     | <p>What to do if we find changes to the cabal or lock file after a build. Value can be <code>warn</code>, or <code>error</code>. Default is <code>warn</code>.</p>                                                                             | `false`  | `warn`              |
| `install-stack`                      | <p>Install stack, if necessary</p>                                                                                                                                                                                                             | `false`  | `true`              |
| `upgrade-stack`                      | <p>Upgrade stack</p>                                                                                                                                                                                                                           | `false`  | `true`              |
| `compiler-tools`                     | <p>A list of packages to install as compiler tools, one per line. This is useful to do here rather than separate <code>run</code> commands so that their installation is incorporated in the dependency cache. Since <code>@v5.2.0</code>.</p> | `false`  | `""`                |
| `stack-yaml`                         | <p><strong>Deprecated</strong> use <code>env.STACK_YAML</code> or <code>stack-arguments</code> instead.</p>                                                                                                                                    | `false`  | `""`                |

<!-- action-docs-inputs action="action.yml" -->

## Outputs

| name                    | description                                                                  |
| ----------------------- | ---------------------------------------------------------------------------- |
| `compiler`              | <p><code>compiler.actual</code> value from stack query</p>                   |
| `compiler-version`      | <p>The GHC version part of compiler</p>                                      |
| `snapshot-doc-root`     | <p><code>snapshot-doc-root</code> value from <code>stack path</code></p>     |
| `local-doc-root`        | <p><code>local-doc-root</code> value from <code>stack path</code></p>        |
| `local-hoogle-root`     | <p><code>local-hoogle-root</code> value from <code>stack path</code></p>     |
| `stack-root`            | <p><code>stack-root</code> value from <code>stack path</code></p>            |
| `project-root`          | <p><code>project-root</code> value from <code>stack path</code></p>          |
| `config-location`       | <p><code>config-location</code> value from <code>stack path</code></p>       |
| `bin-path`              | <p><code>bin-path</code> value from <code>stack path</code></p>              |
| `programs`              | <p><code>programs</code> value from <code>stack path</code></p>              |
| `compiler-exe`          | <p><code>compiler-exe</code> value from <code>stack path</code></p>          |
| `compiler-bin`          | <p><code>compiler-bin</code> value from <code>stack path</code></p>          |
| `compiler-tools-bin`    | <p><code>compiler-tools-bin</code> value from <code>stack path</code></p>    |
| `local-bin`             | <p><code>local-bin</code> value from <code>stack path</code></p>             |
| `extra-include-dirs`    | <p><code>extra-include-dirs</code> value from <code>stack path</code></p>    |
| `extra-library-dirs`    | <p><code>extra-library-dirs</code> value from <code>stack path</code></p>    |
| `snapshot-pkg-db`       | <p><code>snapshot-pkg-db</code> value from <code>stack path</code></p>       |
| `local-pkg-db`          | <p><code>local-pkg-db</code> value from <code>stack path</code></p>          |
| `global-pkg-db`         | <p><code>global-pkg-db</code> value from <code>stack path</code></p>         |
| `ghc-package-path`      | <p><code>ghc-package-path</code> value from <code>stack path</code></p>      |
| `snapshot-install-root` | <p><code>snapshot-install-root</code> value from <code>stack path</code></p> |
| `local-install-root`    | <p><code>local-install-root</code> value from <code>stack path</code></p>    |
| `dist-dir`              | <p><code>dist-dir</code> value from <code>stack path</code></p>              |
| `local-hpc-root`        | <p><code>local-hpc-root</code> value from <code>stack path</code></p>        |

## Installing Compiler Tools

The `compiler-tools` input can be used to install packages (with
`--copy-compiler-tool`) as part of the _Dependencies_ step. The installed tools
can be used by other parts of the build via `stack exec`, such as to reformat
and upload coverage:

```yaml
- id: stack
  uses: freckle/stack-action@v5
  with:
    compiler-tools: hpc-lcov
    stack-build-arguments: --coverage

- run: stack --no-terminal exec -- hpc-lcov --file "$HPC_ROOT"/combined/all/all.tix
  env:
    HPC_ROOT: ${{ steps.stack.outputs.local-hpc-root }}

- uses: codecov/codecov-action@v2
  with:
    files: ./lcov.info
```

Doing it this way, vs a separate `run: stack install...`, means the building of
these tools will be included in the dependencies cache.

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
          stack-arguments: --stack-yaml ${{ matrix.stack-yaml }}
```

See [generate-matrix/action.yml](./generate-matrix/action.yml) for more details.
This has been available since version 4 of this action.

## Release

To trigger a release (and update the `@v{major}` tag), merge a commit to `main`
that follows [Conventional Commits][]. In short,

- `fix:` to trigger a patch release,
- `feat:` for minor, and
- `feat!:` and major

We don't enforce conventional commits generally (though you are free do so),
it's only required if you want to trigger release.

[conventional commits]: https://www.conventionalcommits.org/en/v1.0.0/#summary

---

[LICENSE](./LICENSE)
