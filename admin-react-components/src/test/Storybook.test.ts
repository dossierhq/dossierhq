import initStoryshots, { Stories2SnapsConverter } from '@storybook/addon-storyshots';
import path from 'path';
import type { ReactTestRenderer } from 'react-test-renderer';
import { act, create } from 'react-test-renderer';

jest.mock('@editorjs/editorjs');

const converter = new Stories2SnapsConverter();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function runTest(story: any, context: any) {
  let filename = converter.getSnapshotFileName(context);

  if (!filename) {
    return;
  }

  // Adjust path since we're not running in src/ root
  filename = path.join('..', filename);

  // eslint-disable-next-line testing-library/render-result-naming-convention
  const storyElement = story.render();
  let tree: ReactTestRenderer | undefined;
  await act(async () => {
    tree = create(storyElement);
  });

  expect(tree?.toJSON()).toMatchSpecificSnapshot(filename);

  tree?.unmount();
}

process.chdir(path.resolve(__dirname, '..', '..'));

initStoryshots({
  asyncJest: true,
  framework: 'react',
  test: ({ story, context, done }) => {
    runTest(story, context).then(done);
  },
});
