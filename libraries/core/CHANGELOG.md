# Change Log - @dossierhq/core

This log was last generated on Wed, 14 Feb 2024 18:15:01 GMT and should not be manually modified.

## 0.5.11
Wed, 14 Feb 2024 18:15:01 GMT

### Updates

- Tweak dependencies/peerDependencies

## 0.5.10
Mon, 05 Feb 2024 09:02:17 GMT

_Version update only_

## 0.5.9
Sun, 04 Feb 2024 23:37:34 GMT

_Version update only_

## 0.5.8
Sat, 13 Jan 2024 20:41:15 GMT

### Updates

- Add adminClient.processDirtyEntity()

## 0.5.7
Fri, 05 Jan 2024 09:39:57 GMT

_Version update only_

## 0.5.6
Thu, 04 Jan 2024 15:15:30 GMT

_Version update only_

## 0.5.5
Sat, 30 Dec 2023 13:16:10 GMT

### Updates

- Add LoggerContext

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

### Updates

- Breaks: Rename value item to component in schema. Rename isValueItemXxxField() -> isComponentXxxField(). Rename isXxxField() -> isXxxSingleField(). Rename traverse/validate/normalizeValueItem->t/v/nComponent(). Rename traverse node valueItem->component. Rename valueTypes to componentTypes in entity queries. Rename RichTextNode.valueItem->.component, isRichTextValueItemNode()->isRichTextComponentNode(). createRichTextValueItemNode()->createRichTextComponentNode(). Remove assertIsDefined and assertExhaustive exports.

## 0.4.7
Sat, 07 Oct 2023 15:35:18 GMT

_Version update only_

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

- Break: Rename searchEntities=>getEntities, sampleEntities=>getEntitiesSample, getTotalCount->getEntitiesTotalCount. Break: Remove apis for fetching entity history and publishing history. Break: Rename Admin/PublishedEntitiesQuery/Order to Admin/PublishedEntityQuery/Order. Feat: Add SyncEvent. Add id to ChangelogEvent. Fix: Support generated schema types in traverseEntity()

## 0.4.3
Mon, 28 Aug 2023 10:06:22 GMT

### Updates

- Break: Rename getEntities()->getEntityList(). Break: Change first entity version from 0 to 1. Add AdminClient.getChangelogEvents(), getChangelogEventsTotalCount(). Add getEntityNameBase().

## 0.4.2
Wed, 09 Aug 2023 12:07:34 GMT

### Updates

- Renames: ItemValuePath->ContentValuePath, visitorPathToString->contentValuePathToString, createRichTextRootNode->createRichText, ItemTraverse* to ContentTraverse*, traverseItemField -> traverseContentField, excludeOmitted->excludeOmittedEntityFields in normalizeEntityFields(), normalizeFieldValue->normalizeContentField. Introduce transformEntityFields/ValueItem. Add more validation.

## 0.4.1
Thu, 03 Aug 2023 14:22:11 GMT

### Updates

- Add transient migrations to schema update with renameIndex/deleteIndex support

## 0.4.0
Wed, 02 Aug 2023 10:08:15 GMT

### Updates

- Support renameType/deleteType schema migrations. Support changing field index in schema. Support changing adminOnly in schema. Ensure advisory lock is released when throwing exception in withAdvisoryLock callback.

## 0.3.3
Sat, 22 Jul 2023 20:55:47 GMT

_Version update only_

## 0.3.2
Sat, 22 Jul 2023 14:04:22 GMT

### Updates

- Add tab rich text node and rename createRichTextTextAndLineBreakNodes() to createRichTextTextAndWhitespaceNodes(). Make tab a required rich text node, and expose REQUIRED_RICH_TEXT_NODES. Add version to schema specs. Enable deleteField and renameField migrations.

## 0.3.1
Sun, 25 Jun 2023 20:14:23 GMT

### Updates

- Change typing to allow app clients in more places.

## 0.3.0
Sat, 24 Jun 2023 22:27:41 GMT

### Updates

- Make PublishedSchema share utilities with AdminSchema. Enable validating using PublishedSchema. Simplify error type for  withAdvisoryLock. Support using app admin client for advisory lock. Support valueTypes in search queries.

## 0.2.19
Tue, 13 Jun 2023 21:42:08 GMT

_Version update only_

## 0.2.18
Tue, 13 Jun 2023 20:53:31 GMT

### Updates

- Enable schemas where adminOnly fields refer to adminOnly types

## 0.2.17
Tue, 13 Jun 2023 15:58:39 GMT

### Updates

- Normalize schema. Prevent changing adminOnly of types. Prevent changing field types, removing fields in schema. Prevent duplicate field names in schema. Enable partial update of schema. Validate integer on number fields. Break: Replace AdminSchema.mergeWith() with .updateAndValidate().

## 0.2.16
Tue, 09 May 2023 22:47:11 GMT

_Version update only_

## 0.2.15
Tue, 09 May 2023 22:20:37 GMT

### Updates

- Add values to string field schema

## 0.2.14
Sun, 23 Apr 2023 21:31:27 GMT

### Updates

- Filter admin search/sample on validity

## 0.2.13
Tue, 11 Apr 2023 19:08:01 GMT

_Version update only_

## 0.2.12
Tue, 11 Apr 2023 18:39:14 GMT

_Version update only_

## 0.2.11
Tue, 11 Apr 2023 15:53:50 GMT

### Updates

- Add valid to AdminEntityStatus. Add validateEntityInfo().

## 0.2.10
Tue, 04 Apr 2023 09:26:20 GMT

### Updates

- Move entity info validation to core and validate name and version

## 0.2.9
Mon, 27 Mar 2023 13:49:59 GMT

_Version update only_

## 0.2.8
Mon, 27 Mar 2023 11:41:48 GMT

### Updates

- Normalize/sort schema arrays

## 0.2.7
Wed, 22 Mar 2023 21:32:23 GMT

_Version update only_

## 0.2.6
Wed, 22 Mar 2023 21:17:29 GMT

_Version update only_

## 0.2.5
Tue, 14 Mar 2023 17:47:19 GMT

### Updates

- Break: Require camelCase for pattern names. Check type and field names. Export type AdminFieldSpecificationUpdate. Handle standalone carriage return (no line feed) in createRichTextTextAndLineBreakNodes(). Add createRichTextListNode()/createRichTextListItemNode().

## 0.2.4
Tue, 07 Mar 2023 21:38:54 GMT

### Updates

- Add .client to Admin/PublishedExceptionClient.

## 0.2.3
Sat, 18 Feb 2023 11:05:21 GMT

### Updates

- Break API: Remove isName from schema entity fields, add nameField to entity types. No break to database content. Introduce client.toExceptionClient() and Admin/PublishedExceptionClient.

## 0.2.2
Tue, 14 Feb 2023 18:18:06 GMT

### Updates

- Rename validateTraverseNode() to validateTraverseNodeForSave(). Add validateTraverseNodeForPublish(), normalizeValueItem(), normalizeEntityFields(), groupValidationIssuesByTopLevelPath(). Enable typing for AdminCreate<AddType> in copyEntity(). Enable typing of unique index for clients.

## 0.2.1
Wed, 08 Feb 2023 18:24:39 GMT

### Updates

- Highlight format in RichText

## 0.2.0
Mon, 06 Feb 2023 21:59:52 GMT

_Version update only_

## 0.1.53
Mon, 06 Feb 2023 21:23:05 GMT

### Updates

- Bump minor

## 0.1.52
Tue, 31 Jan 2023 11:27:35 GMT

### Updates

- Link node in RichText.

## 0.1.51
Sun, 29 Jan 2023 18:08:56 GMT

### Updates

- Support app client when converting json.

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

