export type TestFunction = () => void | Promise<void>;
export interface TestSuite {
  [testName: string]: TestFunction;
}

export const AllTests: TestSuite = {
  what: (): void => {
    //empty
  },
};
