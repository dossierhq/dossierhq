import { FullscreenContainer, Message, Text, toSpacingClassName } from '@jonasb/datadata-design';
import { Link } from 'react-router-dom';
import { ChangeDatabaseMessage } from '../components/ChangeDatabaseMessage.js';
import { DatabaseInfoMessage } from '../components/DatabaseInfoMessage.js';
import { NavBar } from '../components/NavBar.js';
import { ROUTE } from '../utils/RouteUtils.js';

export function IndexRoute() {
  return (
    <FullscreenContainer>
      <FullscreenContainer.Row fullWidth>
        <NavBar current="home" />
      </FullscreenContainer.Row>
      <FullscreenContainer.ScrollableRow>
        <FullscreenContainer.Row paddingVertical={5} paddingHorizontal={2}>
          <Text as="h1" textStyle="headline4">
            Welcome to Data data Playground! 👋
          </Text>
          <Text textStyle="body1">
            This is a playground where you can explore Data data. Either start with an empty
            database and head over to the <Link to={ROUTE.schema.url}>Schema</Link> page, or load
            one of the example databases below.
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
          <ChangeDatabaseMessage className={toSpacingClassName({ marginTop: 3 })} />
        </FullscreenContainer.Row>
      </FullscreenContainer.ScrollableRow>
    </FullscreenContainer>
  );
}
