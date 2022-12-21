export function encode(value: string) {
  return Buffer.from(value).toString('base64');
}

function decode(value: string) {
  return Buffer.from(value, 'base64').toString('utf8');
}

function encode2(value: string) {
  return btoa(unescape(encodeURIComponent(value)));
}

function decode2(value: string) {
  return decodeURIComponent(escape(atob(value)));
}

function encode3(value: string) {
  return Buffer.from(value).toString('base64url');
}

function decode3(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

const values = ['', 'a', 'ab', 'abc', 'abcd', 'Send reinforcements', 'Hello 😀 World!', 'åäöÅÄÖ'];

console.log('VARIANT 1');
for (const value of values) {
  const encoded = encode(value);
  const decoded = decode(encoded);
  console.log(value, encoded, decoded);
  if (value !== decoded) {
    console.log(' failed', value, encoded, decoded);
  }
}

console.log('\n\nVARIANT 2');
for (const value of values) {
  const encoded = encode2(value);
  const decoded = decode2(encoded);
  console.log(value, encoded, decoded);
  if (value !== decoded) {
    console.log(' failed', value, encoded, decoded);
  }
}

console.log('\n\nVARIANT 3');
for (const value of values) {
  const encoded = encode3(value);
  const decoded = decode3(encoded);
  console.log(value, encoded, decoded);
  if (value !== decoded) {
    console.log(' failed', value, encoded, decoded);
  }
}
