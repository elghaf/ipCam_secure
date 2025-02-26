import { mongoDBStorageService } from './mongoDBStorageService';

export const storageService = {
  /**
   * Upload a file to storage
   * @param path - Path/filename for the file
   * @param file - File to upload
   * @returns Promise with the file ID
   */
  async uploadFile(path: string, file: File): Promise<string> {
    return mongoDBStorageService.uploadFile(path, file);
  },
  
  /**
   * Delete a file from storage
   * @param fileId - ID of the file to delete
   */
  async deleteFile(fileId: string): Promise<void> {
    return mongoDBStorageService.deleteFile(fileId);
  },
  
  /**
   * Get a file URL
   * @param fileId - ID of the file
   * @returns URL to access the file
   */
  async getFileUrl(fileId: string): Promise<string> {
    return mongoDBStorageService.getFileUrl(fileId);
  },
  
  /**
   * Find a file by path/filename
   * @param path - Path/filename to search for
   * @returns File information or null if not found
   */
  async findFileByPath(path: string): Promise<any> {
    return mongoDBStorageService.findFileByPath(path);
  }
};