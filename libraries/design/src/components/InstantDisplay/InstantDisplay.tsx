import { Temporal } from '@js-temporal/polyfill';
import React from 'react';

export interface InstantDisplayProps {
  className?: string;
  instant: Temporal.Instant;
}

export function InstantDisplay({ className, instant }: InstantDisplayProps): JSX.Element {
  const title = instant.toLocaleString();
  const now = Temporal.Now.instant();

  const relativeTime = getRelativeTime(instant, now);

  return (
    <span className={className} title={title}>
      {relativeTime}
    </span>
  );
}

function getRelativeTime(instant: Temporal.Instant, now: Temporal.Instant) {
  const duration = now.since(instant);
  const secondsAgo = duration.total({ unit: 'seconds' });
  if (secondsAgo < 45) {
    return 'a few seconds ago';
  }
  if (secondsAgo < 90) {
    return 'a minute ago';
  }
  const minutesAgo = Math.round(secondsAgo / 60);
  if (minutesAgo < 45) {
    return `${minutesAgo} minutes ago`;
  }
  if (minutesAgo < 90) {
    return 'an hour ago';
  }
  const hoursAgo = Math.round(minutesAgo / 60);
  if (hoursAgo < 22) {
    return `${hoursAgo} hours ago`;
  }
  if (hoursAgo < 36) {
    return 'a day ago';
  }
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const thenPlainDate = instant.toZonedDateTimeISO(timeZone).toPlainDate();
  const nowPlainDate = now.toZonedDateTimeISO(timeZone).toPlainDate();
  if (thenPlainDate.weekOfYear === nowPlainDate.weekOfYear) {
    return thenPlainDate.toLocaleString(undefined, { weekday: 'short' });
  }
  return thenPlainDate.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: thenPlainDate.year < nowPlainDate.year ? 'numeric' : undefined,
  });
}
