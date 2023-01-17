# Change Log - @dossierhq/core

This log was last generated on Tue, 17 Jan 2023 17:55:40 GMT and should not be manually modified.

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

### Updates

- Add README

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

- (break) Replace buildUrlWithUrlQuery, decodeUrlQueryStringifiedParam, stringifyUrlQueryParams with encodeObjectToURLSearchParams, decodeURLSearchParamsParam. Support typing of authKey. Improve typing of JSON. Enable checking if admin operation is modifying. Upgrade dependencies.

## 0.1.36
Mon, 12 Dec 2022 12:51:59 GMT

### Updates

- Support more rich text nodes. Make clients schema aware. Separate update schema types.  Upgrade dependencies.

## 0.1.35
Sat, 05 Nov 2022 21:33:57 GMT

### Updates

- Sort schema. Add AdminSchema.createAndValidate(). Add isRichTextRootNode and isRichTextParagraphNode. Upgrade dependencies.

## 0.1.34
Tue, 25 Oct 2022 15:23:52 GMT

### Updates

- Support unique index

## 0.1.33
Mon, 17 Oct 2022 15:41:41 GMT

### Updates

- Replace Temporal.Instant with Date. Support field matchPattern in schema and validator. Cache pattern regexps. Upgrade dependencies.

## 0.1.32
Fri, 30 Sep 2022 18:08:39 GMT

### Updates

- Support entity link node in RichText. Update dependencies.

## 0.1.31
Mon, 19 Sep 2022 21:05:31 GMT

_Version update only_

## 0.1.30
Mon, 19 Sep 2022 13:10:56 GMT

### Updates

- Support patterns in schema.

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

- Support adminOnly fields. Remove item visitor. Support published item traverser.

## 0.1.26
Sun, 21 Aug 2022 22:26:51 GMT

### Updates

- Make ValueItem more specific.

## 0.1.25
Sun, 21 Aug 2022 12:14:33 GMT

### Updates

- Switch rich text to Lexical.

## 0.1.24
Mon, 13 Jun 2022 22:58:05 GMT

### Updates

- Support deeper typing of update and upsert.

## 0.1.23
Mon, 13 Jun 2022 21:34:43 GMT

_Version update only_

## 0.1.22
Mon, 13 Jun 2022 12:17:58 GMT

### Updates

- Enable typing AdminEntity harder. Support multiline for String fields. Remove support for transparent json support of schema spec.

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

