import { v4 as uuidv4 } from 'uuid';

/** N.B. This is insecure but needed since the default uuidv4() results in open handle for tests */
export function insecureTestUuidv4(): string {
  const random = new Uint8Array(16);

  for (let i = 0; i < random.length; i++) {
    random[i] = Math.floor(Math.random() * 255);
  }
  return uuidv4({
    random,
  });
}
