# Git Workflow & Release Process

## Branching

`main` is always meant to be release-ready. All work happens on short-lived branches off it, merged back via pull request — direct pushes to `main` are blocked by branch protection.

- `feature/<short-name>` — new functionality
- `fix/<short-name>` — bug fixes
- `hotfix/<short-name>` — same as `fix`, just signals "urgent, review fast"
- `incomplete` — work that's finished as code but deliberately not ready to merge yet. Lives here instead of as uncommitted local changes, so it's visible and can't be accidentally lost. Not a PR — nothing to review yet.

No `develop` branch, no release branches — `main` *is* the release line.

## Pull requests

- Open a PR from your branch into `main`.
- Needs at least 1 approval before it can merge (enforced by branch protection).
- If the PR fixes a tracked issue, reference it in the description (`Fixes #12`) so merging auto-closes it.

## Releases — versioning

The app version has to stay in sync across **three** places, and drift between them has already caused a real failed App Store submission (1.0.15 build 2 — `Info.plist` had a hardcoded version literal that silently ignored the project-setting change):

- `app.json` → `expo.version` / `expo.ios.buildNumber`
- `ios/digitag.xcodeproj/project.pbxproj` → `MARKETING_VERSION` / `CURRENT_PROJECT_VERSION`
- `ios/digitag/Info.plist` → `CFBundleShortVersionString` / `CFBundleVersion`

**After bumping the version in `app.json`, run `npx expo prebuild --clean`** to regenerate `ios/`/`android/` from that single source of truth, instead of hand-editing the other two files. This removes the 3-way sync problem entirely rather than just remembering to update all three by hand.

Bump the marketing version (not just the build number) whenever the *previous* version has already been approved/released on the App Store — Apple closes the pre-release train for further builds under an already-approved version number.

Add a line to `CHANGELOG.md` under a new version heading (move it out of `## Unreleased`) once a version actually ships.

## Bug/feature tracking

Every bug and feature idea gets a GitHub Issue instead of living only in chat — labeled `bug`, `feature`, or `internal-testing`. This is the searchable record of what shipped and why.
