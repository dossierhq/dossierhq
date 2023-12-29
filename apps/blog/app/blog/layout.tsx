import { FullscreenContainer } from '@dossierhq/design';
import { NavBar } from '../../components/NavBar/NavBar';

interface Props {
  children: React.ReactNode;
}

export default function Layout({ children }: Props) {
  return (
    <FullscreenContainer>
      <FullscreenContainer.Row fullWidth>
        <NavBar current="blog" />
      </FullscreenContainer.Row>
      <FullscreenContainer.ScrollableRow>
        <FullscreenContainer.Row paddingVertical={5} center style={{ maxWidth: '40rem' }}>
          {children}
        </FullscreenContainer.Row>
      </FullscreenContainer.ScrollableRow>
    </FullscreenContainer>
  );
}
