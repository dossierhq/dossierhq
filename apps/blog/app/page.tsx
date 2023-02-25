import {
  Button,
  Card2,
  FullscreenContainer,
  Message,
  Text,
  toClassName,
  toFlexItemClassName,
  toSpacingClassName,
} from '@dossierhq/design-ssr';
import type { Metadata } from 'next';
import Image from 'next/image.js';
import Link from 'next/link.js';
import type { WebSite } from 'schema-dts';
import { JsonLd } from '../components/JsonLd/JsonLd';
import { LinkButton } from '../components/LinkButton/LinkButton';
import { NavBar } from '../components/NavBar/NavBar';
import logoLarge from '../public/logo-large.svg';
import { BrowserUrls, canonicalUrl } from '../utils/BrowserUrls';

export const metadata: Metadata = {
  description: 'Dossier is an open source toolkit for building headless CMSs.',
};

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
          <Image src={logoLarge} alt="Dossier logo" height={140} priority />
          <div>
            <Text
              as="h1"
              className={toSpacingClassName({ paddingBottom: 2 })}
              textStyle="headline2"
            >
              Keep control of your content
            </Text>
            <Text textStyle="headline4">
              Dossier is an open source toolkit for building headless CMSs.
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
            title="Your content ⚡️"
            description="You own the content, store it where you want. PostgreSQL and SQLite supported."
          />
          <Feature
            title="Scalable ⚖️"
            description="Small enough to run the full stack in the browser (in-memory SQLite database), flexible enough for large installations using PostgreSQL."
          />
          <Feature
            title="Bring your own auth 🔑"
            description="Dossier doesn’t come with its own auth, instead it allows you to integrate with any existing solution you already have."
          />
          <Feature
            title="Secure all content 🤫"
            description="You’re in charge of who should have access to the content. Content can be public or accessible to a group or person."
          />
          <Feature
            title="User generated and editorial content 🤝"
            description="Thanks to the flexible access control, you can have both user generated content and editorial content in the same database."
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
            Dossier enables you to build solutions where you’re in full control of the content. By
            bringing your own auth (authentication and authorization), database and backend, you can
            build a headless Content Management System (CMS) and integrate it with your app.
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
              Dossier is in <strong>active development</strong> so everything is not yet supported.
              Check out <Link href={BrowserUrls.limitations}>limitations</Link> for more details.
            </Message.Body>
          </Message>
          <div>
            <Text textStyle="headline4">About</Text>
            <Text textStyle="body1">
              Developed with ❤️ by Jonas Bengtsson. Send an{' '}
              <a href="mailto:jonas.b@gmail.com">✉️ email</a> or{' '}
              <a href="https://github.com/dossierhq/dossierhq/issues/new">
                🐛 create an issue on GitHub
              </a>{' '}
              if you have any questions!
            </Text>
          </div>
          <JsonLd<WebSite>
            data={{
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'Dossier',
              headline: 'Dossier is an open source toolkit for building headless CMSs',
              description:
                "Build solutions where you're in full control of the content. Bring your own auth, database and backend, to build a headless CMS and integrate it with your app.",
              image: canonicalUrl('/og-dossier.png'),
              url: canonicalUrl('/'),
            }}
          />
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
