import { Button } from '@jonasb/datadata-design-server';
import Link from 'next/link.js';

type Props = Omit<React.ComponentPropsWithRef<typeof Button>, 'as'> & {
  href: string;
  target?: string;
};

export function LinkButton({ href, children, ...props }: Props) {
  return (
    <Link href={href} legacyBehavior>
      <Button as="a" href={href} {...props}>
        {children}
      </Button>
    </Link>
  );
}
