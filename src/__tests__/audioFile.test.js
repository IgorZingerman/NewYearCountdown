/**
 * Tests the real playAudioFile() from src/lib/audio.js.
 *
 * Key case: on the static Apache host a missing file is answered with the homepage
 * HTML (HTTP 200), so playAudioFile must not try to play it.
 */
import { jest } from '@jest/globals';

const URL_PATH = '/music/TheFinalCountdown.mp3';

function response({ ok = true, contentType = '' } = {}) {
  return {
    ok,
    headers: { get: (name) => (name.toLowerCase() === 'content-type' ? contentType : null) },
  };
}

describe('playAudioFile', () => {
  let playAudioFile;
  let play;
  let AudioMock;

  beforeEach(async () => {
    ({ playAudioFile } = await import('../lib/audio.js'));
    globalThis.window = {};
    globalThis.fetch = jest.fn();
    play = jest.fn().mockResolvedValue(undefined);
    AudioMock = jest.fn(() => ({ play, volume: 1 }));
    globalThis.Audio = AudioMock;
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete globalThis.window;
    delete globalThis.fetch;
    delete globalThis.Audio;
  });

  test('plays the file when the server returns audio', async () => {
    globalThis.fetch.mockResolvedValue(response({ contentType: 'audio/mpeg' }));
    await playAudioFile(URL_PATH);
    expect(AudioMock).toHaveBeenCalledWith(URL_PATH);
    expect(play).toHaveBeenCalledTimes(1);
  });

  test('does not play when the host returns the homepage HTML (SPA fallback)', async () => {
    globalThis.fetch.mockResolvedValue(response({ contentType: 'text/html' }));
    await playAudioFile(URL_PATH);
    expect(AudioMock).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalled();
  });

  test('does not play on a 404', async () => {
    globalThis.fetch.mockResolvedValue(response({ ok: false, contentType: 'text/plain' }));
    await playAudioFile(URL_PATH);
    expect(AudioMock).not.toHaveBeenCalled();
  });

  test('does not throw when the request fails', async () => {
    globalThis.fetch.mockRejectedValue(new Error('network down'));
    await expect(playAudioFile(URL_PATH)).resolves.toBeUndefined();
    expect(AudioMock).not.toHaveBeenCalled();
  });

  test('does nothing outside a browser', async () => {
    delete globalThis.window;
    await playAudioFile(URL_PATH);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});
