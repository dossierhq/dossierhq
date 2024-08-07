import { Message } from '@dossierhq/design';
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.log('Caught error', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Message color="danger">
          <Message.Body>An error has occurred</Message.Body>
        </Message>
      );
    }

    // eslint-disable-next-line react/prop-types
    return this.props.children;
  }
}
