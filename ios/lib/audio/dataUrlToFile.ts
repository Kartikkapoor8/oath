import * as FileSystem from 'expo-file-system/legacy';

/**
 * Writes the base64 payload of a data: URL to the cache directory and
 * returns the resulting file:// URI. expo-audio's underlying iOS player
 * is happiest with file URIs and remote https URLs; arbitrarily large
 * data URIs can be fragile. Use this helper when we receive a data URL
 * from the engine.
 */
export async function dataUrlToFileUri(
  dataUrl: string,
  filename: string,
): Promise<string> {
  const commaIdx = dataUrl.indexOf(',');
  if (commaIdx < 0) {
    throw new Error('not a data URL');
  }
  const base64 = dataUrl.slice(commaIdx + 1);
  const uri = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(uri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return uri;
}
