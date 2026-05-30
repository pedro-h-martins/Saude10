import * as FileSystem from 'expo-file-system';

const AUDIO_DIR = new FileSystem.Directory(FileSystem.Paths.document, 'audio');

async function ensureAudioDirectory(): Promise<FileSystem.Directory> {
  if (!AUDIO_DIR.exists) {
    AUDIO_DIR.create({ intermediates: true, idempotent: true });
  }
  return AUDIO_DIR;
}

function guessExtensionFromUrl(url?: string) {
  if (!url) return '.mp3';
  const last = url.split('?')[0].split('/').pop() || '';
  const m = last.match(/\.(mp3|m4a|wav|aac|ogg)$/i);
  return m ? m[0] : '.mp3';
}

export async function downloadAndCacheAudio(remoteUrl: string, audioId: string): Promise<{ localUri: string }> {
  const directory = await ensureAudioDirectory();
  const ext = guessExtensionFromUrl(remoteUrl);
  const outFile = new FileSystem.File(directory, `${audioId}${ext}`);

  try {
    const res = await fetch(remoteUrl);
    const arrayBuffer = await res.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    outFile.create({ intermediates: true, overwrite: true });
    outFile.write(bytes);
    return { localUri: outFile.uri };
  } catch (e) {
    throw e;
  }
}

export async function getLocalAudioUri(audioId: string): Promise<string | null> {
  const exts = ['.mp3', '.m4a', '.wav', '.aac', '.ogg'];
  const directory = await ensureAudioDirectory();
  for (const ext of exts) {
    try {
      const file = new FileSystem.File(directory, `${audioId}${ext}`);
      const info = file.info();
      if (info && (info as any).size && (info as any).size > 0) return file.uri;
    } catch {

    }
  }
  return null;
}

export async function deleteCachedAudio(audioId: string): Promise<void> {
  const uri = await getLocalAudioUri(audioId);
  if (uri) {
    try {
      const file = new FileSystem.File(uri);
      file.delete();
    } catch (e) {
      console.warn('Failed to delete cached audio', e);
    }
  }
}
