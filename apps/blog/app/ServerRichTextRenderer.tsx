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
  RichTextNodeType,
  richTextTextNodeHasFormat,
} from '@jonasb/datadata-core';
import type { SerializedElementNode } from '@jonasb/datadata-core/lib/esm/third-party/Lexical.js';
import { ClassName, LexicalTheme } from '@jonasb/datadata-design';
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
    return <div className={ClassName['rich-text']}>{await renderChildren(context, node)}</div>;
  }
  if (isRichTextParagraphNode(node)) {
    return (
      <p key={key} className={LexicalTheme.paragraph}>
        {await renderChildren(context, node)}
      </p>
    );
  }
  if (isRichTextTextNode(node)) {
    let formattedText: ReactNode = node.text;
    if (richTextTextNodeHasFormat(node, 'code')) {
      formattedText = (
        <code key={key} className={LexicalTheme.text.code}>
          {formattedText}
        </code>
      );
    }
    return formattedText;
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
  if (node.type === RichTextNodeType.list) {
    return (
      <ul key={key} className={LexicalTheme.list.ul}>
        {await renderChildren(context, node as SerializedElementNode)}
      </ul>
    );
  }
  if (node.type === RichTextNodeType.listitem) {
    return (
      <li key={key} className={LexicalTheme.list.listitem}>
        {await renderChildren(context, node as SerializedElementNode)}
      </li>
    );
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
