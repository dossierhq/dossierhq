import {
  isRichTextCodeHighlightNode,
  isRichTextCodeNode,
  isRichTextComponentNode,
  isRichTextElementNode,
  isRichTextEntityLinkNode,
  isRichTextHeadingNode,
  isRichTextLineBreakNode,
  isRichTextLinkNode,
  isRichTextListItemNode,
  isRichTextListNode,
  isRichTextParagraphNode,
  isRichTextRootNode,
  isRichTextTextNode,
  richTextTextNodeHasFormat,
  type RichText,
  type RichTextElementNode,
  type RichTextNode,
} from '@dossierhq/core';
import { ClassName, LexicalTheme } from '@dossierhq/design';
import type { EditorThemeClasses } from 'lexical';
import Link from 'next/link.js';
import { Fragment, type Key, type ReactNode } from 'react';
import { CloudinaryImage } from '../components/CloudinaryImage/CloudinaryImage';
import { CodapiSnippet } from '../components/CodapiSnippet/CodapiSnippet';
import { BrowserUrls } from '../utils/BrowserUrls';
import {
  isPublishedArticle,
  isPublishedBlogPost,
  isPublishedCloudinaryImage,
  isPublishedCodapiSnippet,
  isPublishedGlossaryTerm,
  type AppPublishedDossierClient,
} from '../utils/SchemaTypes';

interface Props {
  richText: RichText;
  publishedClient: AppPublishedDossierClient;
  theme?: EditorThemeClasses;
  isGlossaryPage?: boolean;
  headingOffset?: number;
}

interface RenderContext {
  publishedClient: AppPublishedDossierClient;
  theme: EditorThemeClasses;
  isGlossaryPage: boolean;
  headingOffset: number;
}

export function ServerRichTextRenderer({
  richText,
  publishedClient,
  isGlossaryPage,
  headingOffset,
  theme,
}: Props) {
  const context: RenderContext = {
    publishedClient,
    theme: theme ?? LexicalTheme,
    isGlossaryPage: !!isGlossaryPage,
    headingOffset: headingOffset ?? 0,
  };
  return renderNode(context, richText.root, null);
}

async function renderNode(
  context: RenderContext,
  node: RichTextNode,
  key: Key | null,
): Promise<JSX.Element> {
  const { theme } = context;

  if (isRichTextRootNode(node)) {
    return (
      <div key={key} className={ClassName['rich-text']}>
        {await renderChildren(context, node)}
      </div>
    );
  }
  if (isRichTextLineBreakNode(node)) {
    return <br key={key} />;
  }
  if (isRichTextCodeNode(node)) {
    let gutter = '1';
    let lineNumber = 1;
    for (const child of node.children) {
      if (isRichTextLineBreakNode(child)) {
        gutter += `\n${++lineNumber}`;
      }
    }
    return (
      <code key={key} className={theme.code} data-gutter={gutter}>
        {await renderChildren(context, node)}
      </code>
    );
  }
  if (isRichTextCodeHighlightNode(node)) {
    return (
      <span
        key={key}
        className={node.highlightType ? theme.codeHighlight?.[node.highlightType] : undefined}
      >
        {node.text}
      </span>
    );
  }
  if (isRichTextParagraphNode(node)) {
    const pChildren = await renderChildren(context, node);
    return (
      <p key={key} className={theme.paragraph}>
        {pChildren.length > 0 ? pChildren : '\u00A0'}
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
    if (richTextTextNodeHasFormat(node, 'italic')) {
      formattedText = (
        <em key={key} className={theme.text?.italic}>
          {formattedText}
        </em>
      );
    }
    if (richTextTextNodeHasFormat(node, 'code')) {
      formattedText = (
        <code key={key} className={theme.text?.code}>
          {formattedText}
        </code>
      );
    }
    return <Fragment key={key}>{formattedText}</Fragment>;
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
      } else if (isPublishedBlogPost(entity)) {
        return (
          <Link key={key} href={BrowserUrls.blogPost(entity.fields.slug)}>
            {await renderChildren(context, node)}
          </Link>
        );
      }
    }
  }
  if (isRichTextHeadingNode(node)) {
    const requestedLevel = parseInt(node.tag[1], 10);
    const HeadingTag = `h${Math.min(requestedLevel + context.headingOffset, 6)}` as
      | 'h1'
      | 'h2'
      | 'h3'
      | 'h4'
      | 'h5'
      | 'h6';
    return (
      <HeadingTag key={key} className={theme.heading?.[node.tag]}>
        {await renderChildren(context, node)}
      </HeadingTag>
    );
  }
  if (isRichTextLinkNode(node)) {
    return (
      <a key={key} href={node.url} target="_blank" rel="noreferrer">
        {await renderChildren(context, node)}
      </a>
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
  if (isRichTextComponentNode(node)) {
    if (isPublishedCloudinaryImage(node.data)) {
      return <CloudinaryImage key={key} image={node.data} height={400} />;
    }
    if (isPublishedCodapiSnippet(node.data)) {
      return <CodapiSnippet key={key} snippet={node.data} />;
    }
  }

  // fallback for unknown element nodes
  if (isRichTextElementNode(node)) {
    return <Fragment key={key}>{renderChildren(context, node)}</Fragment>;
  }
  return <Fragment key={key}></Fragment>;
}

function renderChildren(context: RenderContext, node: RichTextElementNode): Promise<JSX.Element[]> {
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
