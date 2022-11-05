import type {
  PublishedClient,
  RichText,
  RichTextElementNode,
  RichTextNode,
} from '@jonasb/datadata-core';
import {
  isRichTextElementNode,
  isRichTextEntityLinkNode,
  isRichTextParagraphNode,
  isRichTextRootNode,
  isRichTextTextNode,
} from '@jonasb/datadata-core';
import { Text } from '@jonasb/datadata-design';
import Link from 'next/link.js';
import type { Key, ReactNode } from 'react';
import { urls } from '../utils/PageUtils';
import { isPublishedGlossaryTerm } from '../utils/SchemaTypes';

interface Props {
  richText: RichText;
  publishedClient: PublishedClient;
  isGlossaryPage?: boolean;
}

interface RenderContext {
  publishedClient: PublishedClient;
  isGlossaryPage: boolean;
}

export function ServerRichTextRenderer({
  richText,
  publishedClient,
  isGlossaryPage,
}: Props): JSX.Element {
  const context: RenderContext = { publishedClient, isGlossaryPage: !!isGlossaryPage };
  const rendered = renderNode(context, richText.root, null);
  //TODO server side components can be async, but the current typescript types don't allow that
  return rendered as unknown as JSX.Element;
}

async function renderNode(
  context: RenderContext,
  node: RichTextNode,
  key: Key | null
): Promise<ReactNode> {
  if (isRichTextRootNode(node)) {
    return renderChildren(context, node);
  }
  if (isRichTextParagraphNode(node)) {
    return (
      <Text key={key} textStyle="body1">
        {await renderChildren(context, node)}
      </Text>
    );
  }
  if (isRichTextTextNode(node)) {
    return node.text;
  }
  if (isRichTextEntityLinkNode(node)) {
    const entityResult = await context.publishedClient.getEntity(node.reference);
    if (entityResult.isOk()) {
      const entity = entityResult.value;
      if (isPublishedGlossaryTerm(entity)) {
        if (context.isGlossaryPage) {
          return (
            <a key={key} href={`#${entity.fields.slug}`}>
              {await renderChildren(context, node)}
            </a>
          );
        }
        return (
          <Link key={key} href={urls.glossaryTerm(entity.fields.slug)}>
            {await renderChildren(context, node)}
          </Link>
        );
      }
    }
  }

  // fallback for unknown element nodes
  if (isRichTextElementNode(node)) {
    return renderChildren(context, node);
  }
  return null;
}

function renderChildren(context: RenderContext, node: RichTextElementNode): Promise<ReactNode[]> {
  return Promise.all(node.children.map((child, index) => renderNode(context, child, index)));
}
