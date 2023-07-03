import { Button, Dialog2, FullscreenContainer, IconButton, Text } from '@dossierhq/design';

interface Props {
  onCreateLink: () => void;
  onCreateEntityLink: () => void;
}

export function CreateLinkDialog({ onCreateLink, onCreateEntityLink }: Props) {
  return (
    <Dialog2 width="narrow">
      {({ close }) => (
        <FullscreenContainer card height="100%">
          <FullscreenContainer.Row flexDirection="row" alignItems="center">
            <FullscreenContainer.Item flexGrow={1} paddingHorizontal={3} paddingVertical={2}>
              <Text textStyle="headline5">Create link</Text>
            </FullscreenContainer.Item>
            <IconButton icon="close" color="white" onClick={close} />
          </FullscreenContainer.Row>
          <FullscreenContainer.Row margin={2}>
            <Button.Group centered>
              <Button onClick={onCreateLink}>Link</Button>
              <Button onClick={onCreateEntityLink}>Entity link</Button>
            </Button.Group>
          </FullscreenContainer.Row>
        </FullscreenContainer>
      )}
    </Dialog2>
  );
}
