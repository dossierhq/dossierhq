import type { RichText, RichTextElementNode, RichTextNode } from '@jonasb/datadata-core';
import {
  isRichTextElementNode,
  isRichTextEntityLinkNode,
  isRichTextHeadingNode,
  isRichTextListItemNode,
  isRichTextListNode,
  isRichTextParagraphNode,
  isRichTextRootNode,
  isRichTextTextNode,
  richTextTextNodeHasFormat,
} from '@jonasb/datadata-core';
import { ClassName, LexicalTheme } from '@jonasb/datadata-design';
import type { EditorThemeClasses } from 'lexical';
import Link from 'next/link.js';
import type { Key, ReactNode } from 'react';
import { BrowserUrls } from '../utils/BrowserUrls';
import type { AppPublishedClient } from '../utils/SchemaTypes';
import { isPublishedArticle, isPublishedGlossaryTerm } from '../utils/SchemaTypes';

interface Props {
  richText: RichText;
  publishedClient: AppPublishedClient;
  theme?: EditorThemeClasses;
  isGlossaryPage?: boolean;
}

interface RenderContext {
  publishedClient: AppPublishedClient;
  theme: EditorThemeClasses;
  isGlossaryPage: boolean;
}

export function ServerRichTextRenderer({
  richText,
  publishedClient,
  isGlossaryPage,
  theme,
}: Props): JSX.Element {
  const context: RenderContext = {
    publishedClient,
    theme: theme ?? LexicalTheme,
    isGlossaryPage: !!isGlossaryPage,
  };
  const rendered = renderNode(context, richText.root, null);
  //TODO server side components can be async, but the current typescript types don't allow that
  return rendered as unknown as JSX.Element;
}

async function renderNode(
  context: RenderContext,
  node: RichTextNode,
  key: Key | null
): Promise<ReactNode> {
  const { theme } = context;

  if (isRichTextRootNode(node)) {
    return <div className={ClassName['rich-text']}>{await renderChildren(context, node)}</div>;
  }
  if (isRichTextParagraphNode(node)) {
    return (
      <p key={key} className={theme.paragraph}>
        {await renderChildren(context, node)}
      </p>
    );
  }
  if (isRichTextTextNode(node)) {
    let formattedText: ReactNode = node.text;
    if (richTextTextNodeHasFormat(node, 'bold')) {
      formattedText = (
        <strong key={key} className={theme.text?.bold}>
          {formattedText}
        </strong>
      );
    }
    if (richTextTextNodeHasFormat(node, 'code')) {
      formattedText = (
        <code key={key} className={theme.text?.code}>
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
        const description = richTextToPlainText(entity.fields.description);
        return (
          <Link key={key} href={BrowserUrls.glossaryTerm(entity.fields.slug)} title={description}>
            {await renderChildren(context, node)}
          </Link>
        );
      } else if (isPublishedArticle(entity)) {
        return (
          <Link key={key} href={BrowserUrls.article(entity.fields.slug)}>
            {await renderChildren(context, node)}
          </Link>
        );
      }
    }
  }
  if (isRichTextHeadingNode(node)) {
    const HeadingTag = node.tag;
    return (
      <HeadingTag key={key} className={theme.heading?.[node.tag]}>
        {await renderChildren(context, node)}
      </HeadingTag>
    );
  }
  if (isRichTextListNode(node)) {
    const Tag = node.tag === 'ol' ? 'ol' : 'ul';
    return (
      <Tag key={key} className={theme.list?.[node.tag]}>
        {await renderChildren(context, node)}
      </Tag>
    );
  }
  if (isRichTextListItemNode(node)) {
    return (
      <li key={key} className={theme.list?.listitem}>
        {await renderChildren(context, node)}
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

function richTextToPlainText(richText: RichText): string {
  function visitNode(node: RichTextNode): string {
    if (isRichTextTextNode(node)) {
      return node.text;
    }
    if (isRichTextElementNode(node)) {
      return node.children.map(visitNode).join('');
    }
    return '';
  }
  return visitNode(richText.root);
}
