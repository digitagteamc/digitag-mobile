# Changelog

All notable changes to the DigiTag mobile app are documented here, one line per notable fix or feature. Format loosely follows [Keep a Changelog](https://keepachangelog.com/).

## Unreleased

### Added
- Cancel a pending collaboration request from either side (Home feed, Explore tab, and post-detail) instead of it being permanently stuck once sent by mistake.
- Email OTP verification screen in Creator/Freelancer signup and edit-profile (backend enforcement not yet turned on — pending confirmation this build is live for real users).

### Fixed
- Post-detail success popup was hardcoded to always say "Collab Sent!" regardless of which action succeeded — a cancel showed the wrong title with the right body text.
- Instagram verification could get permanently stuck on a resumed signup: reopening the app after verifying Instagram but before finishing the rest of the form always reset to unverified, and re-attempting bounced off the backend's own duplicate check with no way forward. Now restores verified status from the server on load.
- iOS build version was tracked in three separate files (`app.json`, `project.pbxproj`, `Info.plist`) that had drifted out of sync — `Info.plist` had a hardcoded literal version, silently ignoring project-setting changes and causing a failed App Store submission.

## 1.0.16 (build 1) — 2026-08-07
Version bump only, see Unreleased above for what's actually in this build.
