export interface DateDisplayProps {
  className?: string;
  date: Date;
}

export function DateDisplay({ className, date }: DateDisplayProps): JSX.Element {
  const title = date.toLocaleString();
  const now = new Date();

  const relativeTime = getRelativeTime(date, now);

  return (
    <span className={className} title={title}>
      {relativeTime}
    </span>
  );
}

function getRelativeTime(date: Date, now: Date) {
  const duration = now.getTime() - date.getTime();
  const secondsAgo = duration / 1000;
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
  if (duration < 7 * 24 * 60 * 60 * 1000) {
    return date.toLocaleString(undefined, { weekday: 'short' });
  }
  const sameYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: sameYear ? undefined : 'numeric',
  });
}
