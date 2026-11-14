import { destinationUrl } from '../src/links/url';
describe('destination validation', () => {
  it.each([
    'javascript:alert(1)',
    'file:///etc/passwd',
    'https://user:secret@example.com',
    'http://127.0.0.1',
    'http://2130706433',
    'http://10.0.0.1',
    'http://[::1]',
    'http://[::ffff:127.0.0.1]',
    'http://router.local',
    'http://localhost:3000/r/recursive',
    'https://example.com/line' + String.fromCharCode(10) + 'break',
  ])('rejects %s', (url) => {
    expect(() => destinationUrl(url)).toThrow();
  });
  it('preserves a public URL and its query', () =>
    expect(destinationUrl('https://example.com/docs?ref=hello')).toBe(
      'https://example.com/docs?ref=hello',
    ));
});
