interface SemVer {
  major: number;
  minor: number;
  patch: number;
}

export function parseSemVer(version: string): SemVer {
  const [major, minor, patch] = version.split('.').map((it) => Number.parseInt(it));
  return { major, minor, patch };
}

export function isSemVerEqualOrGreaterThan(version: SemVer, minimum: SemVer): boolean {
  return (
    version.major > minimum.major ||
    (version.major === minimum.major &&
      (version.minor > minimum.minor ||
        (version.minor === minimum.minor && version.patch >= minimum.patch)))
  );
}
