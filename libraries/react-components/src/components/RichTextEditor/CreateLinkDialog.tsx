import { Button, Dialog, FullscreenContainer, IconButton, Text } from '@dossierhq/design';

interface Props {
  show: boolean;
  onClose: () => void;
  onCreateLink: () => void;
  onCreateEntityLink: () => void;
}

export function CreateLinkDialog({ show, onClose, onCreateLink, onCreateEntityLink }: Props) {
  return (
    <Dialog show={show} modal onClose={onClose} width="narrow">
      <FullscreenContainer card height="100%">
        <FullscreenContainer.Row flexDirection="row" alignItems="center">
          <FullscreenContainer.Item flexGrow={1} paddingHorizontal={3} paddingVertical={2}>
            <Text textStyle="headline5">Create link</Text>
          </FullscreenContainer.Item>
          <IconButton icon="close" color="white" onClick={onClose} />
        </FullscreenContainer.Row>
        <FullscreenContainer.Row margin={2}>
          <Button.Group centered>
            <Button onClick={onCreateLink}>Link</Button>
            <Button onClick={onCreateEntityLink}>Entity link</Button>
          </Button.Group>
        </FullscreenContainer.Row>
      </FullscreenContainer>
    </Dialog>
  );
}
