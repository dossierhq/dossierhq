import { FullscreenContainer, Message, Text, toSpacingClassName } from '@dossierhq/design';
import { LoadDatabaseMessage } from '../components/LoadDatabaseMessage.js';
import { NavBar } from '../components/NavBar.js';

export function IndexRoute() {
  return (
    <FullscreenContainer>
      <FullscreenContainer.Row fullWidth>
        <NavBar current="home" />
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
            . Either start with an empty database or load one of the example databases below. Check
            out the{' '}
            <a href="https://dossierhq.dev/docs" target="_blank" rel="noopener noreferrer">
              documentation
            </a>{' '}
            for more information.
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
          <LoadDatabaseMessage className={toSpacingClassName({ marginTop: 3 })} />
        </FullscreenContainer.Row>
      </FullscreenContainer.ScrollableRow>
    </FullscreenContainer>
  );
}
