import Script from 'next/script';
import { useId, type HTMLAttributes } from 'react';
import type { PublishedCodapiSnippet } from '../../utils/SchemaTypes';

interface CodapiSnippetElement extends HTMLElement {}

interface CodapiSnippetHTMLAttributes<T> extends HTMLAttributes<T> {
  engine: 'browser';
  sandbox: 'javascript';
  editor: 'basic' | 'external';
  selector?: string;
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
  const id = useId();
  return (
    <>
      <pre>
        <code id={id} className="language-js">
          {snippet.code}
        </code>
      </pre>
      <codapi-snippet
        id={snippet.id ?? undefined}
        engine="browser"
        sandbox="javascript"
        editor="external"
        selector={`#${id.replaceAll(':', '\\:')}`}
        depends-on={snippet.dependsOn ?? undefined}
      />
      <Script id={id + '_script'} type="module" async>
        {`
import {CodeJar} from '/codejar.js';
const editor = document.getElementById('${id}');
const jar = CodeJar(editor, ()=>{}, { tab: '  ', });
`}
      </Script>
    </>
  );
}
