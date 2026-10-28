# CBD Immich fork

This is Country Brook Design's fork of Immich. The current branch is `cbd/v3.3.1`: upstream tag `v3.3.1` plus a small set of `cbd:` commits.

In production it runs on CBD's internal Immich server, built from `server/Dockerfile` and published as `ghcr.io/countrybrookdesign/immich-server:v3.3.1-cbd.N`. The machine-learning image stays on the upstream release.

## Hard rules

- **No database changes.** No migrations and no edits under `server/src/schema/`. Rollback works by swapping back to the upstream image, and that only works if the schema is identical.
- **No API changes.** Don't add endpoints or DTO fields, so `open-api/` and `@immich/sdk` never need regenerating.
- **No new dependencies.** Don't touch `pnpm-lock.yaml`.
- **Stay out of other areas.** Don't change `mobile/`, `machine-learning/`, `docs/`, `e2e/`, or `.github/`.
- **Smallest possible diff.** No refactors, renames, or reformatting of code the feature doesn't need.
- **One commit per feature, prefixed `cbd:`.** Every commit must cherry-pick cleanly onto the next upstream release.
- **Leave generated SQL alone.** `server/src/queries/*.sql` is generated against a live database. Don't edit it, even if a query changes.

## Tooling

- Versions are pinned in `mise.toml`: Node 24 and pnpm 11.27.1. Upstream bumps the Node patch version in most releases (v3.3.1 pins 24.21.0, v3.3.5 pins 24.22.1), so read the exact version from `mise.toml`.
- The workstation runs Windows 11, with Node 24 from winget and pnpm installed globally with `npm install -g pnpm@11.27.1`. Don't use `corepack enable`; it needs an administrator terminal on this machine.
- Line endings are LF. The repo uses `core.autocrlf false`. Never write CRLF, and never convert existing files.
- Install once from the repo root: `pnpm install --frozen-lockfile`
- Build the SDK before running web checks: `pnpm --filter @immich/sdk build`
- Server checks: `pnpm --filter immich run check:code` and `pnpm --filter immich test`
- Web checks: `pnpm --filter immich-web run check:code` and `pnpm --filter immich-web test`
- Before committing, run the checks for every package the commit touches.

## CBD features

Partner users can see the shared library account through partner sharing but don't get some owner-only features. These patches close that gap.

### A. File location for partners (web only)

- In `web/src/lib/components/asset-viewer/DetailPanel.svelte`, the info button that shows the file location is wrapped in `{#if isOwner}`. Show it to partners too.
- No server change is needed. The server already sends `originalPath` to partners.
- Next to the path, add two copy buttons: one for the Windows path (`Z:\...`) and one for the Linux Mint path (`/mnt/main/...`).
- Keep the path mapping below in one constant in its own file, `web/src/lib/cbd/path-map.ts`.

#### Path mapping

The source of this mapping is the volume mounts on the production server, so update this table whenever a library mount is added to `docker-compose.yml`. The `company_files` share is both `Z:\` on Windows and `/mnt/main` on Linux, so each container prefix maps to a folder in that share.

| Container prefix | Share folder |
|---|---|
| `/external/catalog` | `Catalog` |
| `/external/marketing` | `Marketing` |
| `/external/users/kerry` | `Users/Kerry` |
| `/external/users/nicole` | `Users/Nicole` |
| `/external/users/morgan_roper` | `Users/Morgan Roper` |
| `/external/users/chris_jones` | `Users/Chris Jones` |
| `/external/users/morgan_moon/web_elements/blog` | `Users/Morgan Moon/WEB ELEMENTS/BLOG` |
| `/external/users/morgan_moon/web_elements/how-tos` | `Users/Morgan Moon/WEB ELEMENTS/How-Tos` |

Rules:

- Use an explicit lookup table. The container names are lowercased and use underscores, so the share folder can't be derived from them.
- Match on the longest prefix, and only at a `/` boundary, so `/external/catalog` must not match `/external/catalog2`.
- Keep everything after the prefix unchanged. Below the mount point, folder and file names are the real share names.
- Build the Windows path as `Z:\` + share folder + rest of path, with every `/` turned into `\`.
- Build the Linux path as `/mnt/main/` + share folder + rest of path. Keep the exact case, since Linux paths are case-sensitive.
- If no prefix matches (Immich uploads under `/usr/src/app/upload` or `/data`), show the path with no copy buttons.
- Add unit tests for the mapping function.
- The table ships in the public web bundle. Never put anything in it that shouldn't be visible to someone reading the site's JavaScript.

### B. Folders view includes partner assets (server)

- In `server/src/repositories/view-repository.ts`, `getUniqueOriginalPaths` and `getAssetsByOriginalPath` filter on `ownerId = userId`. Change them to take a list of user IDs.
- In `server/src/services/view.service.ts`, pass the current user plus the partners that have "Show in timeline" enabled. Use the same set that search uses (see how `search.service.ts` builds its user IDs).
- This also makes the "go to folder" link on the file location work for partners.

### C. Reset facial recognition is admin-only

- In `server/src/services/cluster-group.service.ts`, `regeneratePeople` only checks `ClusterGroupRead`. That lets any member of the cluster group wipe every person's name for everyone in the group. Require an admin.
- In the web UI, hide the "Reset facial recognition" button for non-admins.

## Out of scope

- Per-user favorites on shared assets, because it needs schema changes.
- The mobile app.

## Upgrading to a new Immich release

1. Create `cbd/vX.Y.Z` from the new upstream tag.
2. Cherry-pick the `cbd:` commits onto it and resolve any conflicts.
3. Rerun the checks.
4. Tag the image `vX.Y.Z-cbd.1`.
