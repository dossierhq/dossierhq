# Change Log - @jonasb/datadata-server

This log was last generated on Sun, 13 Feb 2022 21:58:15 GMT and should not be manually modified.

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
-  createdAt/updatedAt sort order
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

