import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { encryptText, decryptText } from './encryptionService';

const IMAGES_DIR = `${FileSystem.documentDirectory}journal_images/`;

/**
 * Initialize images directory
 */
export const initializeImagesDirectory = async (): Promise<void> => {
  try {
    const dirInfo = await FileSystem.getInfoAsync(IMAGES_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(IMAGES_DIR, { intermediates: true });
    }
  } catch (error) {
    console.error('Error initializing images directory:', error);
    throw new Error('Failed to initialize images directory');
  }
};

/**
 * Compress and resize image
 */
export const compressImage = async (
  uri: string,
  maxWidth: number = 1200,
  maxHeight: number = 1200,
  quality: number = 0.8
): Promise<string> => {
  try {
    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: maxWidth, height: maxHeight } }],
      { compress: quality, format: ImageManipulator.SaveFormat.JPEG }
    );
    return manipResult.uri;
  } catch (error) {
    console.error('Error compressing image:', error);
    throw new Error('Failed to compress image');
  }
};

/**
 * Save image with encryption (as base64 encrypted string)
 */
export const saveEncryptedImage = async (
  imageUri: string,
  imageName: string,
  encryptionKey: string
): Promise<string> => {
  try {
    await initializeImagesDirectory();

    // Read image as base64
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Encrypt the base64 string
    const encrypted = encryptText(encryptionKey, base64);

    // Save encrypted data
    const filePath = `${IMAGES_DIR}${imageName}.enc`;
    await FileSystem.writeAsStringAsync(filePath, encrypted);

    return filePath;
  } catch (error) {
    console.error('Error saving encrypted image:', error);
    throw new Error('Failed to save encrypted image');
  }
};

/**
 * Load and decrypt image
 */
export const loadEncryptedImage = async (
  filePath: string,
  encryptionKey: string
): Promise<string> => {
  try {
    // Read encrypted data
    const encrypted = await FileSystem.readAsStringAsync(filePath);

    // Decrypt to base64
    const base64 = decryptText(encryptionKey, encrypted);

    // Create a temporary file with decrypted data
    const tempPath = `${FileSystem.cacheDirectory}temp_${Date.now()}.jpg`;
    await FileSystem.writeAsStringAsync(tempPath, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return tempPath;
  } catch (error) {
    console.error('Error loading encrypted image:', error);
    throw new Error('Failed to load encrypted image');
  }
};

/**
 * Delete encrypted image file
 */
export const deleteEncryptedImage = async (filePath: string): Promise<void> => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(filePath);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(filePath);
    }
  } catch (error) {
    console.error('Error deleting encrypted image:', error);
    throw new Error('Failed to delete encrypted image');
  }
};

/**
 * Get thumbnail URI (for list view)
 */
export const createThumbnail = async (
  uri: string,
  size: number = 200
): Promise<string> => {
  try {
    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: size, height: size } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );
    return manipResult.uri;
  } catch (error) {
    console.error('Error creating thumbnail:', error);
    return uri; // Return original if thumbnail creation fails
  }
};
