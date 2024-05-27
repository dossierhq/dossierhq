import type { FunctionComponent, ReactNode } from 'react';
import { toColorClassName, type Color } from '../../config/Colors.js';
import { toClassName } from '../../utils/ClassNameUtils.js';
import { toFlexContainerClassName, type FlexContainerProps } from '../../utils/FlexboxUtils.js';
import { toSpacingClassName, type SpacingProps } from '../../utils/LayoutPropsUtils.js';

export interface MessageProps {
  className?: string;
  color?: Color;
  children: ReactNode;
}

interface MessageHeaderProps {
  children?: ReactNode;
}

interface MessageHeaderTitleProps {
  children?: ReactNode;
}

interface MessageBodyProps {
  children?: ReactNode;
}

interface MessageFlexBodyProps extends FlexContainerProps, SpacingProps {
  children?: ReactNode;
}

export interface MessageComponent extends FunctionComponent<MessageProps> {
  Header: FunctionComponent<MessageHeaderProps>;
  HeaderTitle: FunctionComponent<MessageHeaderTitleProps>;
  Body: FunctionComponent<MessageBodyProps>;
  FlexBody: FunctionComponent<MessageFlexBodyProps>;
}

export const Message: MessageComponent = ({ className, color, children }: MessageProps) => {
  return (
    <article className={toClassName('message', toColorClassName(color), className)}>
      {children}
    </article>
  );
};
Message.displayName = 'Message';

Message.Header = ({ children }: MessageHeaderProps) => {
  return <div className="message-header">{children}</div>;
};
Message.Header.displayName = 'Message.Header';

Message.HeaderTitle = ({ children }: MessageHeaderTitleProps) => {
  return <p>{children}</p>;
};
Message.HeaderTitle.displayName = 'Message.HeaderTitle';

Message.Body = ({ children }: MessageBodyProps) => {
  return <div className="message-body">{children}</div>;
};
Message.Body.displayName = 'Message.Body';

Message.FlexBody = ({ children, ...props }: MessageFlexBodyProps) => {
  const flexContainerProps = { flexDirection: 'column', ...props } as const;
  const overridePadding = Object.keys(props).some((it) => it.startsWith('padding'));
  const spacingProps = overridePadding ? ({ padding: 0, ...props } as const) : props;

  return (
    <div
      className={toClassName(
        'message-body',
        toFlexContainerClassName(flexContainerProps),
        toSpacingClassName(spacingProps),
      )}
    >
      {children}
    </div>
  );
};
Message.FlexBody.displayName = 'Message.FlexBody';
