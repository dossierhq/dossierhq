import initStoryshots, { Stories2SnapsConverter } from '@storybook/addon-storyshots';
import { act, create, ReactTestRenderer } from 'react-test-renderer';

const converter = new Stories2SnapsConverter();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const runTest = async (story: any, context: any) => {
  const filename = converter.getSnapshotFileName(context);

  if (!filename) {
    return;
  }

  const storyElement = story.render();
  let tree: ReactTestRenderer | undefined;
  await act(async () => {
    tree = create(storyElement);
  });

  expect(tree?.toJSON()).toMatchSpecificSnapshot(filename);

  tree?.unmount();
};

initStoryshots({
  asyncJest: true,
  test: ({ story, context, done }) => {
    runTest(story, context).then(done);
  },
});
