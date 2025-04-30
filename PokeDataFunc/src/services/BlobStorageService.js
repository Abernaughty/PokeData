"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlobStorageService = void 0;
class BlobStorageService {
    constructor(connectionString, containerName) {
        this.containerName = 'cards';
        this.connectionString = connectionString;
        if (containerName) {
            this.containerName = containerName;
        }
    }
    async exists(blobPath) {
        console.log(`[BlobStorageService] Checking if blob exists: ${blobPath}`);
        // Mock implementation for local testing
        return false;
    }
    async uploadBlob(blobPath, content, contentType) {
        console.log(`[BlobStorageService] Uploading blob: ${blobPath}`);
        // Mock implementation for local testing
        return `http://localhost:10000/devstoreaccount1/${this.containerName}/${blobPath}`;
    }
    async downloadBlob(blobPath) {
        console.log(`[BlobStorageService] Downloading blob: ${blobPath}`);
        // Mock implementation for local testing
        return null;
    }
    async generateSasUrl(blobPath, expiryMinutes = 60) {
        console.log(`[BlobStorageService] Generating SAS URL for blob: ${blobPath} with expiry: ${expiryMinutes} minutes`);
        // Mock implementation for local testing
        return `http://localhost:10000/devstoreaccount1/${this.containerName}/${blobPath}?sv=2020-08-04&ss=b&srt=co&sp=r&se=${Date.now() + expiryMinutes * 60 * 1000}&st=${Date.now()}&spr=https&sig=mock-signature`;
    }
    async listBlobs(prefix) {
        console.log(`[BlobStorageService] Listing blobs with prefix: ${prefix}`);
        // Mock implementation for local testing
        return [];
    }
    async deleteBlob(blobPath) {
        console.log(`[BlobStorageService] Deleting blob: ${blobPath}`);
        // Mock implementation for local testing
        return true;
    }
}
exports.BlobStorageService = BlobStorageService;
//# sourceMappingURL=BlobStorageService.js.map