import {
  Button,
  Card2,
  FullscreenContainer,
  Message,
  Text,
  toClassName,
  toFlexItemClassName,
  toSpacingClassName,
} from '@jonasb/datadata-design-server';
import Image from 'next/image.js';
import { LinkButton } from '../components/LinkButton/LinkButton';
import { NavBar } from '../components/NavBar/NavBar';
import logo from '../public/logo.svg';
import { BrowserUrls } from '../utils/BrowserUrls';

export default function Page() {
  return (
    <FullscreenContainer>
      <FullscreenContainer.Row fullWidth>
        <NavBar current="home" />
      </FullscreenContainer.Row>
      <FullscreenContainer.ScrollableRow>
        <FullscreenContainer.Row
          paddingTop={3}
          paddingBottom={5}
          paddingHorizontal={4}
          gap={5}
          style={{ maxWidth: '50rem' }}
        >
          <Image src={logo} alt="Data data logo" height={80} />
          <div>
            <Text
              as="h1"
              className={toSpacingClassName({ paddingBottom: 2 })}
              textStyle="headline2"
            >
              Stay in control of your content
            </Text>
            <Text textStyle="headline4">
              Data data is an embeddable content platform. Open source.
            </Text>
          </div>
          <LinkButton
            className={toClassName(toFlexItemClassName({ alignSelf: 'flex-start' }))}
            href={BrowserUrls.docs}
            color="primary"
          >
            Get started
          </LinkButton>
          <Feature
            title="Your data ⚡️"
            description="You own the data, store it where you want. PostgreSQL and SQLite supported."
          />
          <Feature
            title="Scalable ⚖️"
            description="Small enough to run the full stack in the browser (in-memory SQLite database), flexible enough for large installations using PostgreSQL."
          />
          <Feature
            title="Bring your own auth 🔑"
            description="Data data doesn’t come with its own auth, instead it allows you to integrate with any existing solution you already have."
          />
          <Feature
            title="Secure all content 🤫"
            description="You’re in charge of who should have access to the content. Content can be public or accessible to a group or person."
          />
          <Feature
            title="Developer friendly ⌨️"
            description={
              <>
                Generated TypeScript types and GraphQL schema out of the box.
                <br />
                Create local test environments in under a second.
                <br />
                Everything is open source so you can see how everything is built and contribute
                improvements.
              </>
            }
          />
          <hr />
          <Text textStyle="body1">
            Data data enables you to build solutions where you’re in full control of the data. By
            bringing your own auth (authentication and authorization), database and server, you can
            build a traditional headless Content Management System (CMS). You can also skip the
            browser interface and use Data data to manage the data in a backend or app.
          </Text>
          <Card2>
            <Card2.Header>
              <Card2.HeaderTitle>Now what? 🗺️</Card2.HeaderTitle>
            </Card2.Header>
            <Card2.Content>
              <Text className={toSpacingClassName({ marginBottom: 3 })} textStyle="body1">
                Read the docs to learn more or jump straight in and try it out in the Playground.
              </Text>
              <Button.Group>
                <LinkButton href={BrowserUrls.docs} color="primary">
                  Read the docs
                </LinkButton>
                <LinkButton
                  href={BrowserUrls.playground()}
                  target="_blank"
                  iconRight="openInNewWindow"
                >
                  Explore the Playground
                </LinkButton>
              </Button.Group>
            </Card2.Content>
          </Card2>
          <Message color="warning">
            <Message.Body>
              Data data is in <strong>active development</strong> so everything is not yet
              supported.
              <br />
              Get in touch if you’re missing something.
            </Message.Body>
          </Message>
          <div>
            <Text textStyle="headline4">About</Text>
            <Text textStyle="body1">
              Developed with ❤️ by Jonas Bengtsson. Send an{' '}
              <a href="mailto:jonas.b@gmail.com">✉️ email</a> if you have any questions!
            </Text>
          </div>
        </FullscreenContainer.Row>
      </FullscreenContainer.ScrollableRow>
    </FullscreenContainer>
  );
}

function Feature({ title, description }: { title: string; description: React.ReactNode }) {
  return (
    <div>
      <Text as="h2" textStyle="headline4">
        {title}
      </Text>
      <Text textStyle="body1">{description}</Text>
    </div>
  );
}
