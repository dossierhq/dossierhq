import { FullscreenContainer, Message, Text, toSpacingClassName } from '@dossierhq/design';
import { DatabaseInfoMessage } from '../components/DatabaseInfoMessage.js';
import { NavBar } from '../components/NavBar.js';

export function ServerRoute() {
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
          <Text textStyle="body1">This is a playground where you can explore Dossier.</Text>
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
