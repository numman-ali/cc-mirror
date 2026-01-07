export type Platform = 'win32' | 'darwin' | 'linux';

export const getPlatform = (): Platform => {
  const p = process.platform;
  if (p === 'win32' || p === 'darwin' || p === 'linux') return p;
  return 'linux';
};

export const isWindows = (platform: Platform = getPlatform()): boolean => platform === 'win32';

export const getWrapperExtension = (platform: Platform = getPlatform()): string => (platform === 'win32' ? '.cmd' : '');

export const getWrapperFilename = (name: string, platform: Platform = getPlatform()): string =>
  `${name}${getWrapperExtension(platform)}`;
