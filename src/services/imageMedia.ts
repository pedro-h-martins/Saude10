import * as FileSystem from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

const PROGRESS_PHOTO_DIR = new FileSystem.Directory(FileSystem.Paths.document, 'progress_photos');

async function ensureProgressPhotoDirectory(): Promise<FileSystem.Directory> {
  if (!PROGRESS_PHOTO_DIR.exists) {
    PROGRESS_PHOTO_DIR.create({ intermediates: true, idempotent: true });
  }
  return PROGRESS_PHOTO_DIR;
}

export async function compressAndStoreProgressPhoto(
  sourceUri: string,
  photoId: string
): Promise<{ localUri: string; width?: number; height?: number; fileSize: number }> {
  const directory = await ensureProgressPhotoDirectory();
  const outputFile = new FileSystem.File(directory, `${photoId}.jpg`);

  const manipContext = ImageManipulator.manipulate(sourceUri).resize({ width: 1080 });
  const imageRef = await manipContext.renderAsync();
  const saveResult = await imageRef.saveAsync({
    compress: 0.78,
    format: SaveFormat.JPEG,
  });

  const sourceFile = new FileSystem.File(saveResult.uri);
  const bytes = await sourceFile.bytes();

  outputFile.create({ intermediates: true, overwrite: true });
  outputFile.write(bytes);

  const fileInfo = outputFile.info();
  const fileSize = typeof fileInfo.size === 'number' ? fileInfo.size : 0;

  return {
    localUri: outputFile.uri,
    width: saveResult.width,
    height: saveResult.height,
    fileSize,
  };
}
