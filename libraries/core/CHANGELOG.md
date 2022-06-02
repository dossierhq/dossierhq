# Change Log - @jonasb/datadata-core

This log was last generated on Thu, 02 Jun 2022 21:27:42 GMT and should not be manually modified.

## 0.1.15
Thu, 02 Jun 2022 21:27:42 GMT

### Updates

- Upgrade dependencies

## 0.1.14
Mon, 30 May 2022 18:59:49 GMT

### Updates

- Add assertOkResult, assertErrorResultType

## 0.1.13
Mon, 30 May 2022 15:28:33 GMT

### Updates

- Replace typescript enums with const {}

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

- Support fieldItem in traverseAdminItem. Add Ok/ErrorFromResult.

## 0.1.7
Tue, 22 Mar 2022 23:23:55 GMT

_Version update only_

## 0.1.6
Tue, 22 Mar 2022 21:24:28 GMT

### Updates

- Add PagingInfo type

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

- Support entity sampling. Support advisory locks

## 0.1.1
Sun, 13 Feb 2022 21:58:15 GMT

### Updates

- Add OkResult.map() and ErrorType.isErrorType()
- Configure importHelpers for ts, and add tslib dependency
- Export transpiled JavaScript
- Fix export configuration
- Allow string in schema field specification
- Enable easier JSON serialization of adminClient
- Support boolean type
- upsertEntity() support in AdminClient
- Make AdminEntityUpsert.fields required
- Normalize field values. Effect on create/update entity
- Add isEntityNameAsRequested()
- Normalize value items with missing fields'
- Add Conflict as error to createEntity(). Upgrade dependencies
- createdAt/updatedAt sort order
- Use Temporal, createdAt, updatedAt, random tweaks
- Minor tweaks
- Support context provider for published client
- Convert instants for searchAdminEntities() for JSON, require logger for client context
- Add NoOpLogger, createConsoleLogger
- Add url query utils
- Add searchEntities and getTotalCount to PublishedClient
- Add JSON support to PublishedClient
- Add getSchemaSpecification() to PublishedClient. Fix JSON conversion of getEntities().
- Upgrade dependencies. Support adminOnly.
- Status filter
- Support ItemValuePath
- Support required fields. Add item traverser. 
- Support reverse order
- Support authKeys
- Add createdAt to EntityInfo
- Upgrade depencencies. Renames by adding Published prefix. Add {publish:true}.
- Remove authKeys from reference to entity (they always use the actual authkey of the entity). Support sampleEntities(). Add optional id to RichTextBlock.
- Support interface for buildUrlWithUrlQuery

## 0.1.0
Mon, 12 Jul 2021 17:25:50 GMT

### Updates

- Initial release

