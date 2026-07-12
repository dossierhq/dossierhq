import { FullscreenContainer, Message, Text, toSpacingClassName } from '@dossierhq/design';
import { Link, useParams } from 'react-router-dom';
import { DatabaseInfoMessage } from '../components/DatabaseInfoMessage.js';
import { assertIsDefined } from '../utils/AssertUtils.js';
import { ROUTE } from '../utils/RouteUtils.js';

export function ServerRoute() {
  const { serverName } = useParams<{ serverName: string }>();
  assertIsDefined(serverName);
  return (
    <FullscreenContainer>
      <FullscreenContainer.Row fullWidth>
        <nav style={{ display: 'flex', gap: '1rem', padding: '0.5rem 1rem' }}>
          <Link to={ROUTE.contentList.url(serverName)}>Content</Link>
          <Link to={ROUTE.publishedContentList.url(serverName)}>Published content</Link>
          <Link to={ROUTE.schemaEditor.url(serverName)}>Schema</Link>
          <Link to={ROUTE.changelog.url(serverName)}>Changelog</Link>
        </nav>
      </FullscreenContainer.Row>
      <FullscreenContainer.ScrollableRow>
        <FullscreenContainer.Row paddingVertical={5} paddingHorizontal={2}>
          <Text as="h1" textStyle="headline4">
            Welcome to Dossier Playground! 👋
          </Text>
          <Text textStyle="body1">
            This is a playground where you can explore{' '}
            <a href="https://dossierhq.dev" target="_blank" rel="noopener noreferrer">
              Dossier
            </a>
            . Check out the{' '}
            <a href="https://dossierhq.dev/docs" target="_blank" rel="noopener noreferrer">
              documentation
            </a>{' '}
            for more information.
          </Text>
          <Text textStyle="body1">
            There is no real authentication in the Playground, but you can switch between two users
            in the User dropdown in the top right corner. The two users are Alice and Bob. No
            password required. 😀
          </Text>
          <Text textStyle="body1" marginTop={2}>
            Happy playing! 🎉
          </Text>
          <Message className={toSpacingClassName({ marginTop: 5 })} color="danger">
            <Message.Body>
              <p>
                The database in the Playground is only stored in your browser. If you close or
                refresh the browser tab all changes will be lost.
              </p>
              <p>Make sure to download a copy of the database if you want to keep it.</p>
            </Message.Body>
          </Message>
          <DatabaseInfoMessage className={toSpacingClassName({ marginTop: 3 })} />
        </FullscreenContainer.Row>
      </FullscreenContainer.ScrollableRow>
    </FullscreenContainer>
  );
}
