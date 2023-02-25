import type { Thing, WithContext } from 'schema-dts';

interface Props<T extends Thing> {
  data: WithContext<T>;
}

export function JsonLd<T extends Thing>({ data }: Props<T>) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data, null, 2),
      }}
    />
  );
}
