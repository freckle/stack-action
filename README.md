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

## Inputs

<table>    <thead>        <tr>            <th>name</th>            <th>description</th>            <th>default</th>            <th>required</th>        </tr>    </thead>    <tbody>        <tr>            <td><p><code>working-directory</code></p></td>            <td><p>Working directory for run commands</p></td>            <td><p><code>.</code></p></td>            <td><p><code>true</code></p></td>        </tr>        <tr>            <td><p><code>stack-yaml</code></p></td>            <td><p>Override stack.yaml, relative to working-directory</p></td>            <td><p><code>stack.yaml</code></p></td>            <td><p><code>true</code></p></td>        </tr>        <tr>            <td><p><code>test</code></p></td>            <td><p>Whether to run tests</p></td>            <td><p><code>true</code></p></td>            <td><p><code>false</code></p></td>        </tr>        <tr>            <td><p><code>stack-arguments</code></p></td>            <td><p>Additional arguments for all top-level <code>stack</code> command invocations.</p></td>            <td><p><code>--no-terminal</code></p></td>            <td><p><code>true</code></p></td>        </tr>        <tr>            <td><p><code>stack-query-arguments</code></p></td>            <td><p>Additional arguments in <code>stack query</code> invocations.</p></td>            <td><p><code>""</code></p></td>            <td><p><code>true</code></p></td>        </tr>        <tr>            <td><p><code>stack-path-arguments</code></p></td>            <td><p>Additional arguments in <code>stack path</code> invocations.</p></td>            <td><p><code>""</code></p></td>            <td><p><code>true</code></p></td>        </tr>        <tr>            <td><p><code>stack-setup-arguments</code></p></td>            <td><p>Additional arguments in <code>stack setup</code> invocations.</p></td>            <td><p><code>""</code></p></td>            <td><p><code>true</code></p></td>        </tr>        <tr>            <td><p><code>stack-build-arguments</code></p></td>            <td><p>Additional arguments for all <code>stack build</code> invocations.</p></td>            <td><p><code>--fast --pedantic</code></p></td>            <td><p><code>true</code></p></td>        </tr>        <tr>            <td><p><code>stack-build-arguments-dependencies</code></p></td>            <td><p>Additional arguments passed after <code>stack-build-arguments</code> in <code>stack build</code> invocations on the <code>Dependencies</code> step.</p></td>            <td><p><code>""</code></p></td>            <td><p><code>true</code></p></td>        </tr>        <tr>            <td><p><code>stack-build-arguments-build</code></p></td>            <td><p>Additional arguments passed after <code>stack-build-arguments</code> in <code>stack build</code> invocations on the <code>Build</code> step.</p></td>            <td><p><code>""</code></p></td>            <td><p><code>true</code></p></td>        </tr>        <tr>            <td><p><code>stack-build-arguments-test</code></p></td>            <td><p>Additional arguments passed after <code>stack-build-arguments</code> in <code>stack build</code> invocations on the <code>Test</code> step.</p></td>            <td><p><code>""</code></p></td>            <td><p><code>true</code></p></td>        </tr>        <tr>            <td><p><code>cache-prefix</code></p></td>            <td><p>Cache prefix</p></td>            <td><p><code>""</code></p></td>            <td><p><code>true</code></p></td>        </tr>        <tr>            <td><p><code>cache-save-always</code></p></td>            <td><p>Save the dependencies and build cache even if a build fails</p></td>            <td><p><code>false</code></p></td>            <td><p><code>false</code></p></td>        </tr>    </tbody></table>

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
