import type { PublishValidationIssue, SaveValidationIssue } from '@dossierhq/core';
import type { JSX } from 'react';

interface Props {
  validationIssues: (SaveValidationIssue | PublishValidationIssue)[];
}

export function ValidationIssuesDisplay({ validationIssues }: Props): JSX.Element {
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
