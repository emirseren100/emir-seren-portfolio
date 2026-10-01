/** Resolves when the display face is ready, or after a timeout — never blocks forever. */
export function fontsReady(timeout = 1600): Promise<void> {
  if (typeof document === 'undefined' || !('fonts' in document)) return Promise.resolve();
  const load = Promise.all([
    document.fonts.load('500 100px "Bricolage Grotesque Variable"', 'Emir Şeren'),
    document.fonts.load('italic 400 20px "Newsreader Variable"', 'a'),
    document.fonts.load('400 12px "Geist Mono Variable"', 'a'),
  ]).then(() => undefined);
  const timer = new Promise<void>((r) => window.setTimeout(r, timeout));
  return Promise.race([load, timer]).catch(() => undefined);
}
