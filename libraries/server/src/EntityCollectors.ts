import {
  ContentTraverseNodeType,
  assertIsDefined,
  isEntityItemField,
  isLocationItemField,
  isRichTextEntityLinkNode,
  isRichTextEntityNode,
  isRichTextTextNode,
  isRichTextValueItemNode,
  isStringItemField,
  isValueItemItemField,
  type AdminSchema,
  type ContentTraverseNode,
  type ContentValuePath,
  type EntityFieldSpecification,
  type EntityReference,
  type Location,
  type PublishedSchema,
  type RichTextFieldSpecification,
} from '@dossierhq/core';

export interface UniqueIndexValue {
  path: ContentValuePath;
  value: string;
}

export type UniqueIndexValueCollection = Map<string, UniqueIndexValue[]>;

export interface RequestedReference {
  path: ContentValuePath;
  uuids: string[];
  isRichTextLink: boolean;
  entityTypes: string[] | undefined;
  linkEntityTypes: string[] | undefined;
}

export function createFullTextSearchCollector<TSchema extends AdminSchema | PublishedSchema>() {
  const fullTextSearchText: string[] = [];
  return {
    collect: (node: ContentTraverseNode<TSchema>) => {
      switch (node.type) {
        case ContentTraverseNodeType.fieldItem:
          if (isStringItemField(node.fieldSpec, node.value) && node.value) {
            fullTextSearchText.push(node.value);
          }
          break;
        case ContentTraverseNodeType.richTextNode: {
          const richTextNode = node.node;
          if (isRichTextTextNode(richTextNode) && richTextNode.text) {
            fullTextSearchText.push(richTextNode.text);
          }
          break;
        }
      }
    },
    get result() {
      return fullTextSearchText.join(' ');
    },
  };
}

//TODO we have three similar implementations of this function, should it move to core?
export function createReferencesCollector<TSchema extends AdminSchema | PublishedSchema>() {
  const references = new Set<string>();
  return {
    collect: (node: ContentTraverseNode<TSchema>) => {
      switch (node.type) {
        case ContentTraverseNodeType.fieldItem:
          if (isEntityItemField(node.fieldSpec, node.value) && node.value) {
            references.add(node.value.id);
          }
          break;
        case ContentTraverseNodeType.richTextNode: {
          const richTextNode = node.node;
          if (isRichTextEntityNode(richTextNode) || isRichTextEntityLinkNode(richTextNode)) {
            references.add(richTextNode.reference.id);
          }
          break;
        }
      }
    },
    get result(): EntityReference[] {
      return [...references].map((id) => ({ id }));
    },
  };
}

export function createRequestedReferencesCollector<
  TSchema extends AdminSchema | PublishedSchema,
>() {
  const requestedReferences: RequestedReference[] = [];
  return {
    collect: (node: ContentTraverseNode<TSchema>) => {
      switch (node.type) {
        case ContentTraverseNodeType.fieldItem:
          if (isEntityItemField(node.fieldSpec, node.value) && node.value) {
            const entityItemFieldSpec = node.fieldSpec as EntityFieldSpecification;
            requestedReferences.push({
              path: node.path,
              uuids: [node.value.id],
              entityTypes: entityItemFieldSpec.entityTypes,
              linkEntityTypes: undefined,
              isRichTextLink: false,
            });
          }
          break;
        case ContentTraverseNodeType.richTextNode: {
          const richTextNode = node.node;
          if (isRichTextEntityNode(richTextNode) || isRichTextEntityLinkNode(richTextNode)) {
            const richTextFieldSpecification = node.fieldSpec as RichTextFieldSpecification;
            requestedReferences.push({
              path: node.path,
              uuids: [richTextNode.reference.id],
              entityTypes: richTextFieldSpecification.entityTypes,
              linkEntityTypes: richTextFieldSpecification.linkEntityTypes,
              isRichTextLink: isRichTextEntityLinkNode(richTextNode),
            });
          }
          break;
        }
      }
    },
    get result(): RequestedReference[] {
      return requestedReferences;
    },
  };
}

export function createUniqueIndexCollector<TSchema extends AdminSchema | PublishedSchema>(
  schema: TSchema,
) {
  const uniqueIndexValues: UniqueIndexValueCollection = new Map();
  return {
    collect: (node: ContentTraverseNode<TSchema>) => {
      switch (node.type) {
        case ContentTraverseNodeType.fieldItem: {
          const indexName = 'index' in node.fieldSpec ? node.fieldSpec.index : undefined;
          if (indexName && isStringItemField(node.fieldSpec, node.value) && node.value) {
            const indexValues = uniqueIndexValues.get(indexName);
            if (indexValues) {
              //TODO fail on duplicates?
              if (!indexValues.find((it) => it.value === node.value)) {
                indexValues.push({ path: node.path, value: node.value });
              }
            } else {
              const index = schema.getIndex(indexName);
              assertIsDefined(index);
              if (index.type === 'unique') {
                uniqueIndexValues.set(indexName, [{ path: node.path, value: node.value }]);
              }
            }
          }
          break;
        }
      }
    },
    get result(): UniqueIndexValueCollection {
      return uniqueIndexValues;
    },
  };
}

export function createLocationsCollector<TSchema extends AdminSchema | PublishedSchema>() {
  const locations: Location[] = [];
  return {
    collect: (node: ContentTraverseNode<TSchema>) => {
      switch (node.type) {
        case ContentTraverseNodeType.fieldItem:
          if (isLocationItemField(node.fieldSpec, node.value) && node.value) {
            locations.push(node.value);
          }
          break;
      }
    },
    get result(): Location[] {
      return locations;
    },
  };
}

export function createValueTypesCollector<TSchema extends AdminSchema | PublishedSchema>() {
  const payload = new Set<string>();
  return {
    collect: (node: ContentTraverseNode<TSchema>) => {
      switch (node.type) {
        case ContentTraverseNodeType.fieldItem:
          if (isValueItemItemField(node.fieldSpec, node.value) && node.value) {
            payload.add(node.value.type);
          }
          break;
        case ContentTraverseNodeType.richTextNode: {
          const richTextNode = node.node;
          if (isRichTextValueItemNode(richTextNode)) {
            payload.add(richTextNode.data.type);
          }
          break;
        }
      }
    },
    get result(): string[] {
      return [...payload];
    },
  };
}
