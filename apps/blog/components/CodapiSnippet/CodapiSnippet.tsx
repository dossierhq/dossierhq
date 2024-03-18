import type { HTMLAttributes } from 'react';
import type { PublishedCodapiSnippet } from '../../utils/SchemaTypes';
import Script from 'next/script';

interface CodapiSnippetElement extends HTMLElement {}

interface CodapiSnippetHTMLAttributes<T> extends HTMLAttributes<T> {
  engine: 'browser';
  sandbox: 'javascript';
  editor: 'basic';
  'depends-in'?: string;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'codapi-snippet': React.DetailedHTMLProps<
        CodapiSnippetHTMLAttributes<CodapiSnippetElement>,
        CodapiSnippetElement
      >;
    }
  }
}

export function CodapiSnippet({ snippet }: { snippet: PublishedCodapiSnippet }) {
  return (
    <>
      <pre>{snippet.code}</pre>
      <codapi-snippet
        id={snippet.id ?? undefined}
        engine="browser"
        sandbox="javascript"
        editor="basic"
        depends-on={snippet.dependsOn ?? undefined}
      />
    </>
  );
}
