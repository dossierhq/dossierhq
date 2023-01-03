import { FullscreenContainer, Message, Text, toSpacingClassName } from '@jonasb/datadata-design';
import { ChangeDatabaseMessage } from '../components/ChangeDatabaseMessage.js';
import { DatabaseInfoMessage } from '../components/DatabaseInfoMessage.js';
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
            Welcome to datadata Playground!
          </Text>
          <Text textStyle="body1">This is a playground where you can explore datadata.</Text>
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
          <ChangeDatabaseMessage className={toSpacingClassName({ marginTop: 3 })} />
        </FullscreenContainer.Row>
      </FullscreenContainer.ScrollableRow>
    </FullscreenContainer>
  );
}
