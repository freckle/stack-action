import { parseStackPath } from "./parse-stack-path";

const EXAMPLE = [
  "snapshot-doc-root: /home/patrick/.stack/snapshots/x86_64-linux-tinfo6/0dd02c1d8a380045321779c4567c2aa8873910743eac342f72d56f3d26881028/9.2.7/doc",
  "local-doc-root: /home/patrick/code/freckle/megarepo/backend/.stack-work/install/x86_64-linux-tinfo6/0dd02c1d8a380045321779c4567c2aa8873910743eac342f72d56f3d26881028/9.2.7/doc",
  "local-hoogle-root: /home/patrick/code/freckle/megarepo/backend/.stack-work/hoogle/x86_64-linux-tinfo6/0dd02c1d8a380045321779c4567c2aa8873910743eac342f72d56f3d26881028/9.2.7",
  "stack-root: /home/patrick/.stack",
  "global-config: /home/patrick/.stack/config.yaml",
  "project-root: /home/patrick/code/freckle/megarepo/backend",
  "config-location: /home/patrick/code/freckle/megarepo/backend/stack.yaml",
  "bin-path: /home/patrick/.stack/snapshots/x86_64-linux-tinfo6/7eed7816433ae7cc7801479e88c42a76f77602f2a5c39ec077837318841a4e18/9.2.7/bin:/home/patrick/.stack/compiler-tools/x86_64-linux-tinfo6/ghc-9.2.7/bin:/home/patrick/.stack/programs/x86_64-linux/ghc-tinfo6-9.2.7/bin:/home/patrick/.nvm/versions/node/v16.13.1/bin:/home/patrick/.local/bin:/home/patrick/.local/share/gem/ruby/3.0.0/bin:/home/patrick/.nix-profile/bin:/nix/var/nix/profiles/default/bin:/usr/local/sbin:/usr/local/bin:/usr/bin:/usr/lib/jvm/default/bin:/usr/bin/site_perl:/usr/bin/vendor_perl:/usr/bin/core_perl",
  "programs: /home/patrick/.stack/programs/x86_64-linux",
  "compiler-exe: /home/patrick/.stack/programs/x86_64-linux/ghc-tinfo6-9.2.7/bin/ghc-9.2.7",
  "compiler-bin: /home/patrick/.stack/programs/x86_64-linux/ghc-tinfo6-9.2.7/bin",
  "compiler-tools-bin: /home/patrick/.stack/compiler-tools/x86_64-linux-tinfo6/ghc-9.2.7/bin",
  "local-bin: /home/patrick/.local/bin",
  "extra-include-dirs:",
  "extra-library-dirs:",
  "snapshot-pkg-db: /home/patrick/.stack/snapshots/x86_64-linux-tinfo6/7eed7816433ae7cc7801479e88c42a76f77602f2a5c39ec077837318841a4e18/9.2.7/pkgdb",
  "local-pkg-db: /home/patrick/code/freckle/megarepo/backend/.stack-work/install/x86_64-linux-tinfo6/7eed7816433ae7cc7801479e88c42a76f77602f2a5c39ec077837318841a4e18/9.2.7/pkgdb",
  "global-pkg-db: /home/patrick/.stack/programs/x86_64-linux/ghc-tinfo6-9.2.7/lib/ghc-9.2.7/package.conf.d",
  "ghc-package-path: /home/patrick/code/freckle/megarepo/backend/.stack-work/install/x86_64-linux-tinfo6/7eed7816433ae7cc7801479e88c42a76f77602f2a5c39ec077837318841a4e18/9.2.7/pkgdb:/home/patrick/.stack/snapshots/x86_64-linux-tinfo6/7eed7816433ae7cc7801479e88c42a76f77602f2a5c39ec077837318841a4e18/9.2.7/pkgdb:/home/patrick/.stack/programs/x86_64-linux/ghc-tinfo6-9.2.7/lib/ghc-9.2.7/package.conf.d",
  "snapshot-install-root: /home/patrick/.stack/snapshots/x86_64-linux-tinfo6/7eed7816433ae7cc7801479e88c42a76f77602f2a5c39ec077837318841a4e18/9.2.7",
  "local-install-root: /home/patrick/code/freckle/megarepo/backend/.stack-work/install/x86_64-linux-tinfo6/7eed7816433ae7cc7801479e88c42a76f77602f2a5c39ec077837318841a4e18/9.2.7",
  "dist-dir: .stack-work/dist/x86_64-linux-tinfo6/ghc-9.2.7",
  "local-hpc-root: /home/patrick/code/freckle/megarepo/backend/.stack-work/install/x86_64-linux-tinfo6/7eed7816433ae7cc7801479e88c42a76f77602f2a5c39ec077837318841a4e18/9.2.7/hpc",
].join("\n");

test("parseStackPath", () => {
  const stackPath = parseStackPath(EXAMPLE);

  // Test one non-null and one nullable
  expect(stackPath["stack-root"]).toBe("/home/patrick/.stack");
  expect(stackPath["extra-include-dirs"]).toBeNull();
});
