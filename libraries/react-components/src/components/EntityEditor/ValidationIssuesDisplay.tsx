import type { PublishValidationIssue, SaveValidationIssue } from '@dossierhq/core';
import { Text } from '@dossierhq/design';

interface Props {
  validationIssues: (SaveValidationIssue | PublishValidationIssue)[];
}

export function ValidationIssuesDisplay({ validationIssues }: Props) {
  return (
    <>
      {validationIssues.map((error, index) => (
        <Text key={index} textStyle="body2" marginTop={1} color="danger">
          {error.message}
        </Text>
      ))}
    </>
  );
}
