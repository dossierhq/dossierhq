# Change Log - @dossierhq/server

## 0.7.19

### Patch Changes

- Updated dependencies [b3471ee]
  - @dossierhq/core@0.7.19
  - @dossierhq/database-adapter@0.7.19

## 0.7.18

### Patch Changes

- @dossierhq/core@0.7.18
- @dossierhq/database-adapter@0.7.18

## 0.7.17

### Patch Changes

- @dossierhq/core@0.7.17
- @dossierhq/database-adapter@0.7.17

## 0.7.16

### Patch Changes

- @dossierhq/core@0.7.16
- @dossierhq/database-adapter@0.7.16

## 0.7.15

### Patch Changes

- @dossierhq/core@0.7.15
- @dossierhq/database-adapter@0.7.15

## 0.7.14

### Patch Changes

- Updated dependencies [6f4d122]
  - @dossierhq/core@0.7.14
  - @dossierhq/database-adapter@0.7.14

This log was last generated on Sun, 09 Feb 2025 13:11:00 GMT and should not be manually modified.

## 0.7.12

Sun, 09 Feb 2025 13:11:00 GMT

_Version update only_

## 0.7.11

Sun, 09 Feb 2025 12:55:36 GMT

_Version update only_

## 0.7.10

Sun, 15 Dec 2024 11:40:33 GMT

### Updates

- Fix logging of advisory locks

## 0.7.9

Sun, 24 Nov 2024 13:36:03 GMT

_Version update only_

## 0.7.8

Fri, 02 Aug 2024 14:47:04 GMT

_Version update only_

## 0.7.7

Sat, 22 Jun 2024 22:08:27 GMT

### Updates

- Fix: Create publishEntities event when publishing with updateEntity and no change. Support DossierClient.deleteEntities.

## 0.7.6

Fri, 10 May 2024 12:33:35 GMT

### Updates

- Use nameField to create default name. Return effect=none instead of Conflict if creating identity existing entity

## 0.7.5

Tue, 07 May 2024 22:07:47 GMT

### Updates

- Make name optional in create/upsertEntity

## 0.7.4

Sun, 05 May 2024 16:56:55 GMT

### Updates

- Break: Rename Server.createPublishedClient->createPublishedDossierClient, ServerPlugin.onCreatePublishedClient->onCreatePublishedDossierClient

## 0.7.3

Sun, 05 May 2024 15:39:06 GMT

_Version update only_

## 0.7.2

Sun, 05 May 2024 15:16:43 GMT

_Version update only_

## 0.7.1

Sun, 05 May 2024 13:57:17 GMT

_Version update only_

## 0.7.0

Sun, 05 May 2024 12:27:29 GMT

### Updates

- Break: Rename Server.createAdminClient() to .createDossierClient()
- Break: Rename ServerPlugin.onCreateAdminClient to .onCreateDossierClient'

## 0.6.2

Sun, 31 Mar 2024 22:07:35 GMT

### Updates

- Break: Remove Server.createPrincipal(). Support createPrincipal event.

## 0.6.1

Fri, 29 Mar 2024 16:34:07 GMT

_Version update only_

## 0.6.0

Fri, 29 Mar 2024 16:18:10 GMT

### Updates

- Break: Replace NoneAndSubjectAuthorizationAdapter with SubjectAuthorizationAdapter and make DefaultAuthorizationAdapter the default. Support '' as default authKey. Make auth adapter optional. Add default defaultAuthKeys. Make optional args optional in createSession()

## 0.5.16

Sun, 25 Feb 2024 23:10:35 GMT

### Updates

- Enable authorization adapter to return no authkey when resolving. Handle readonly temporary session for session authkey.

## 0.5.15

Sun, 25 Feb 2024 19:40:27 GMT

_Version update only_

## 0.5.14

Mon, 19 Feb 2024 23:33:24 GMT

_Version update only_

## 0.5.13

Thu, 15 Feb 2024 23:04:57 GMT

### Updates

- Support server.reloadSchema()

## 0.5.12

Wed, 14 Feb 2024 20:49:59 GMT

### Updates

- Support readonly session

## 0.5.11

Wed, 14 Feb 2024 18:15:01 GMT

### Updates

- v

## 0.5.10

Mon, 05 Feb 2024 09:02:18 GMT

_Version update only_

## 0.5.9

Sun, 04 Feb 2024 23:37:34 GMT

_Version update only_

## 0.5.8

Sat, 13 Jan 2024 20:41:15 GMT

_Version update only_

## 0.5.7

Fri, 05 Jan 2024 09:39:57 GMT

_Version update only_

## 0.5.6

Thu, 04 Jan 2024 15:15:30 GMT

_Version update only_

## 0.5.5

Sat, 30 Dec 2023 13:16:10 GMT

_Version update only_

## 0.5.4

Fri, 29 Dec 2023 14:26:15 GMT

### Updates

- Improve tree-shaking

## 0.5.3

Thu, 07 Dec 2023 20:57:43 GMT

_Version update only_

## 0.5.2

Thu, 07 Dec 2023 20:47:42 GMT

_Version update only_

## 0.5.1

Wed, 29 Nov 2023 23:38:35 GMT

_Version update only_

## 0.5.0

Wed, 29 Nov 2023 23:11:50 GMT

_Version update only_

## 0.4.7

Sat, 07 Oct 2023 15:35:19 GMT

### Updates

- Support syncing principals between dossier instances

## 0.4.6

Sat, 23 Sep 2023 22:00:31 GMT

### Updates

- Fix exports config for CJS projects

## 0.4.5

Sat, 23 Sep 2023 20:55:11 GMT

### Updates

- Only publish ESM

## 0.4.4

Sat, 16 Sep 2023 09:58:58 GMT

### Updates

- Support getSyncEvents() and applySyncEvent()

## 0.4.3

Mon, 28 Aug 2023 10:06:22 GMT

### Updates

- Add changelog events. Use the version's name for published name.

## 0.4.2

Wed, 09 Aug 2023 12:07:34 GMT

### Updates

- Introduce encode version and change how fields are encoded. Move remaining validation to core.

## 0.4.1

Thu, 03 Aug 2023 14:22:11 GMT

### Updates

- Support transient migrations effects to db

## 0.4.0

Wed, 02 Aug 2023 10:08:15 GMT

### Updates

- Support renameType/deleteType schema migrations. Support changing field index in schema. Support changing adminOnly in schema. Allow specifying filter when processing dirty entities. Update entity indexes even if entity is invalid. Update unique values indexes when processing dirty even if we cannot add all. Only log when validity of entity changes when processing in the background.

## 0.3.3

Sat, 22 Jul 2023 20:55:47 GMT

_Version update only_

## 0.3.2

Sat, 22 Jul 2023 14:04:22 GMT

### Updates

- Support schema version and migrations.

## 0.3.1

Sun, 25 Jun 2023 20:14:23 GMT

### Updates

- Change typing to allow app clients in more places.

## 0.3.0

Sat, 24 Jun 2023 22:27:41 GMT

### Updates

- Fix count of validated entities in log. Rename Server.revalidateNextEntity() to processNextDirtyEntity() and BackgroundEntityValidatorPlugin to BackgroundEntityProcessorPlugin. Support indexing and validating entities. Validate for save for when publishing. Fail when trying to publish already published invalid entity

## 0.2.19

Tue, 13 Jun 2023 21:42:08 GMT

_Version update only_

## 0.2.18

Tue, 13 Jun 2023 20:53:31 GMT

_Version update only_

## 0.2.17

Tue, 13 Jun 2023 15:58:39 GMT

### Updates

- Actually validate schema definition after update.

## 0.2.16

Tue, 09 May 2023 22:47:11 GMT

_Version update only_

## 0.2.15

Tue, 09 May 2023 22:20:38 GMT

### Updates

- Support values in string fields

## 0.2.14

Sun, 23 Apr 2023 21:31:27 GMT

_Version update only_

## 0.2.13

Tue, 11 Apr 2023 19:08:01 GMT

_Version update only_

## 0.2.12

Tue, 11 Apr 2023 18:39:14 GMT

### Updates

- Reduce logging for BackgroundEntityValidatorPlugin to at most 1/s

## 0.2.11

Tue, 11 Apr 2023 15:53:50 GMT

### Updates

- Add revalidateNextEntity(). Calculate types to revalidate after schema update and mark entities for revalidation. Introduce ServerPlugin and BackgroundEntityValidatorPlugin.

## 0.2.10

Tue, 04 Apr 2023 09:26:20 GMT

### Updates

- Support optimizing db. Move entity info validation to core

## 0.2.9

Mon, 27 Mar 2023 13:49:59 GMT

_Version update only_

## 0.2.8

Mon, 27 Mar 2023 11:41:48 GMT

### Updates

- Break: Require logger and databasePerformance for createSession()

## 0.2.7

Wed, 22 Mar 2023 21:32:23 GMT

_Version update only_

## 0.2.6

Wed, 22 Mar 2023 21:17:29 GMT

_Version update only_

## 0.2.5

Tue, 14 Mar 2023 17:47:19 GMT

_Version update only_

## 0.2.4

Tue, 07 Mar 2023 21:38:54 GMT

_Version update only_

## 0.2.3

Sat, 18 Feb 2023 11:05:21 GMT

### Updates

- Handle change to name field in schema.

## 0.2.2

Tue, 14 Feb 2023 18:18:06 GMT

_Version update only_

## 0.2.1

Wed, 08 Feb 2023 18:24:39 GMT

_Version update only_

## 0.2.0

Mon, 06 Feb 2023 21:59:52 GMT

_Version update only_

## 0.1.53

Mon, 06 Feb 2023 21:23:05 GMT

### Updates

- Bump minor

## 0.1.52

Tue, 31 Jan 2023 11:27:35 GMT

_Version update only_

## 0.1.51

Sun, 29 Jan 2023 18:08:56 GMT

_Version update only_

## 0.1.50

Sat, 28 Jan 2023 14:37:31 GMT

_Version update only_

## 0.1.49

Mon, 23 Jan 2023 09:38:38 GMT

_Version update only_

## 0.1.48

Sun, 22 Jan 2023 22:28:24 GMT

_Version update only_

## 0.1.47

Sun, 22 Jan 2023 22:01:52 GMT

### Updates

- Upgrade dependencies.

## 0.1.46

Tue, 17 Jan 2023 19:56:51 GMT

_Version update only_

## 0.1.45

Tue, 17 Jan 2023 17:55:40 GMT

_Version update only_

## 0.1.44

Tue, 17 Jan 2023 17:41:02 GMT

_Version update only_

## 0.1.43

Tue, 17 Jan 2023 10:34:29 GMT

_Version update only_

## 0.1.42

Tue, 17 Jan 2023 09:23:40 GMT

_Version update only_

## 0.1.41

Tue, 17 Jan 2023 08:54:04 GMT

_Version update only_

## 0.1.40

Mon, 16 Jan 2023 21:32:52 GMT

_Version update only_

## 0.1.39

Mon, 16 Jan 2023 21:07:04 GMT

### Updates

- First release after @dossierhq/ move

## 0.1.38

Mon, 02 Jan 2023 22:59:38 GMT

_Version update only_

## 0.1.37

Mon, 02 Jan 2023 17:39:42 GMT

### Updates

- Support sample seed 0..1 (i.e. Math.random()). Upgrade dependencies.

## 0.1.36

Mon, 12 Dec 2022 12:51:59 GMT

### Updates

- Upgrade dependencies.

## 0.1.35

Sat, 05 Nov 2022 21:33:57 GMT

### Updates

- Upgrade dependencies.

## 0.1.34

Tue, 25 Oct 2022 15:23:52 GMT

### Updates

- Support unique index

## 0.1.33

Mon, 17 Oct 2022 15:41:41 GMT

### Updates

- Replace Temporal.Instant with Date. Upgrade dependencies. Tweak item traversal.

## 0.1.32

Fri, 30 Sep 2022 18:08:39 GMT

### Updates

- Support entity link node in RichText.

## 0.1.31

Mon, 19 Sep 2022 21:05:31 GMT

_Version update only_

## 0.1.30

Mon, 19 Sep 2022 13:10:56 GMT

### Updates

- Support authKeyPattern.

## 0.1.29

Tue, 06 Sep 2022 09:47:25 GMT

### Updates

- Upgrade dependencies.

## 0.1.28

Tue, 30 Aug 2022 21:10:47 GMT

_Version update only_

## 0.1.27

Tue, 30 Aug 2022 14:05:13 GMT

### Updates

- Support adminOnly fields.

## 0.1.26

Sun, 21 Aug 2022 22:26:51 GMT

_Version update only_

## 0.1.25

Sun, 21 Aug 2022 12:14:33 GMT

### Updates

- Switch rich text to Lexical.

## 0.1.24

Mon, 13 Jun 2022 22:58:05 GMT

### Updates

- Support deeper typing of update an

## 0.1.23

Mon, 13 Jun 2022 21:34:43 GMT

_Version update only_

## 0.1.22

Mon, 13 Jun 2022 12:17:58 GMT

### Updates

- Support multiline

## 0.1.21

Tue, 07 Jun 2022 21:00:46 GMT

_Version update only_

## 0.1.20

Mon, 06 Jun 2022 22:23:03 GMT

_Version update only_

## 0.1.19

Mon, 06 Jun 2022 15:26:55 GMT

_Version update only_

## 0.1.18

Mon, 06 Jun 2022 14:27:59 GMT

_Version update only_

## 0.1.17

Fri, 03 Jun 2022 19:47:15 GMT

_Version update only_

## 0.1.16

Thu, 02 Jun 2022 22:03:43 GMT

_Version update only_

## 0.1.15

Thu, 02 Jun 2022 21:27:42 GMT

### Updates

- Upgrade dependencies

## 0.1.14

Mon, 30 May 2022 18:59:49 GMT

_Version update only_

## 0.1.13

Mon, 30 May 2022 15:28:33 GMT

_Version update only_

## 0.1.12

Mon, 30 May 2022 11:14:25 GMT

### Updates

- Output ESM and CJS.

## 0.1.11

Tue, 24 May 2022 15:02:06 GMT

_Version update only_

## 0.1.10

Tue, 17 May 2022 22:02:29 GMT

_Version update only_

## 0.1.9

Tue, 17 May 2022 21:38:25 GMT

_Version update only_

## 0.1.8

Tue, 17 May 2022 18:54:10 GMT

### Updates

- Upgrade dependencies

## 0.1.7

Tue, 22 Mar 2022 23:23:55 GMT

### Updates

- Fix off-by-one error when calculating hasPreviousPage

## 0.1.6

Tue, 22 Mar 2022 21:24:28 GMT

### Updates

- Support accurate hasPreviousPage info.

## 0.1.5

Sat, 12 Mar 2022 09:19:52 GMT

_Version update only_

## 0.1.4

Mon, 07 Mar 2022 22:35:33 GMT

_Version update only_

## 0.1.3

Sun, 06 Mar 2022 19:47:26 GMT

_Version update only_

## 0.1.2

Mon, 28 Feb 2022 22:25:07 GMT

### Updates

- Support entity sampling. Support advisory locks.

## 0.1.1

Sun, 13 Feb 2022 21:58:15 GMT

### Updates

- Support createPrincipalIfMissing in createSessionForPrincipal()
- Configure importHelpers for ts, and add tslib dependency
- Export transpiled JavaScript
- Fix export configuration
- Rename resolveContext to context when creating clients
- Support boolean type
- upsertEntity() support in AdminClient
- Normalize field values. Effect on create/update entity
- Do not change entity with upsert if the name is as requested
- Normalize value items with missing fields
- Upgrade dependenncies
- createdAt/updatedAt sort order
- Temporal, create DatabaseAdapter
- Rewrite integration with the server
- Support context provider for published client
- Middleware support when creating client
- Add searchEntities and getTotalCount to PublishedClient
- Add getSchemaSpecification() to PublishedClient
- Upgrade dependencies. Support adminOnly.
- Status filter
- Support required fields
- Support reverse order
- Support authKeys
- Add createdAt to EntityInfo
- Extract database adapter.
- Actually verify authKeys. Simplify AuthorizationAdapter. Export standard NoneAndSubjectAuthorizationAdapter. Support sample entities.
- Support sample entities with fewer than requested count

## 0.1.0

Mon, 12 Jul 2021 17:25:50 GMT

### Updates

- Initial release
