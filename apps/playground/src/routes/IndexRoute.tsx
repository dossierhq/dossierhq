import { FullscreenContainer, Text, toSpacingClassName } from '@jonasb/datadata-design';
import { ChangeDatabaseMessage } from '../components/ChangeDatabaseMessage';
import { DatabaseInfoMessage } from '../components/DatabaseInfoMessage';
import { NavBar } from '../components/NavBar';

export function IndexRoute() {
  return (
    <FullscreenContainer>
      <FullscreenContainer.Row fullWidth>
        <NavBar current="home" />
      </FullscreenContainer.Row>
      <FullscreenContainer.Row>
        <Text as="h1" textStyle="headline4">
          Welcome to datadata Playground!
        </Text>
        <Text textStyle="body1">This is a playground where you can explore datadata.</Text>
        <DatabaseInfoMessage className={toSpacingClassName({ marginTop: 5 })} />
        <ChangeDatabaseMessage className={toSpacingClassName({ marginTop: 3 })} />
      </FullscreenContainer.Row>
    </FullscreenContainer>
  );
}
