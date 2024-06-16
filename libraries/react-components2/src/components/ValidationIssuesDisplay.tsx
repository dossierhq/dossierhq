import type { PublishValidationIssue, SaveValidationIssue } from '@dossierhq/core';

interface Props {
  validationIssues: (SaveValidationIssue | PublishValidationIssue)[];
}

export function ValidationIssuesDisplay({ validationIssues }: Props) {
  return (
    <>
      {validationIssues.map((error, index) => (
        <p key={index} className="mt-1 leading-7 text-red-400">
          {error.message}
        </p>
      ))}
    </>
  );
}
