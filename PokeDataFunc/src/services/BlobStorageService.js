"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlobStorageService = void 0;
const storage_blob_1 = require("@azure/storage-blob");
class BlobStorageService {
    constructor(connectionString, containerName = 'cards') {
        this.blobServiceClient = storage_blob_1.BlobServiceClient.fromConnectionString(connectionString);
        // Create container if it doesn't exist
        this.initializeContainer(containerName);
        // Initialize container client (will be properly set in initializeContainer)
        this.containerClient = this.blobServiceClient.getContainerClient(containerName);
        // Extract account name and key from connection string for SAS generation
        const connectionParts = connectionString.split(';');
        const accountNamePart = connectionParts.find(part => part.startsWith('AccountName='));
        const accountKeyPart = connectionParts.find(part => part.startsWith('AccountKey='));
        this.accountName = accountNamePart ? accountNamePart.split('=')[1] : '';
        this.accountKey = accountKeyPart ? accountKeyPart.split('=')[1] : '';
    }
    async initializeContainer(containerName) {
        try {
            // Get container client
            this.containerClient = this.blobServiceClient.getContainerClient(containerName);
            // Check if container exists, create if not
            const exists = await this.containerClient.exists();
            if (!exists) {
                console.log(`Creating container: ${containerName}`);
                await this.containerClient.create();
                // Configure CORS for the container
                // Note: CORS is configured at the storage account level, not container level
                // This would typically be done through the Azure Portal or Azure CLI
            }
        }
        catch (error) {
            console.error(`Error initializing container ${containerName}:`, error);
            // Still use the container client even if we couldn't create it
            // It might exist already or be created later
        }
    }
    async exists(blobPath) {
        try {
            const blockBlobClient = this.containerClient.getBlockBlobClient(blobPath);
            return await blockBlobClient.exists();
        }
        catch (error) {
            console.error(`Error checking if blob exists ${blobPath}:`, error);
            return false;
        }
    }
    async uploadBlob(blobPath, content, contentType) {
        try {
            const blockBlobClient = this.containerClient.getBlockBlobClient(blobPath);
            const options = contentType ? { blobHTTPHeaders: { blobContentType: contentType } } : undefined;
            if (typeof content === 'string') {
                await blockBlobClient.upload(content, content.length, options);
            }
            else {
                await blockBlobClient.upload(content, content.length, options);
            }
            return blockBlobClient.url;
        }
        catch (error) {
            console.error(`Error uploading blob ${blobPath}:`, error);
            throw error;
        }
    }
    async downloadBlob(blobPath) {
        try {
            const blockBlobClient = this.containerClient.getBlockBlobClient(blobPath);
            const exists = await blockBlobClient.exists();
            if (!exists) {
                return null;
            }
            const downloadResponse = await blockBlobClient.download(0);
            // Check if readableStreamBody exists
            if (!downloadResponse.readableStreamBody) {
                return null;
            }
            // Convert stream to buffer
            const chunks = [];
            for await (const chunk of downloadResponse.readableStreamBody) {
                chunks.push(Buffer.from(chunk));
            }
            return Buffer.concat(chunks);
        }
        catch (error) {
            console.error(`Error downloading blob ${blobPath}:`, error);
            return null;
        }
    }
    async generateSasUrl(blobPath, expiryMinutes = 60) {
        try {
            if (!this.accountName || !this.accountKey) {
                throw new Error('Account name and key are required for SAS generation');
            }
            const sharedKeyCredential = new storage_blob_1.StorageSharedKeyCredential(this.accountName, this.accountKey);
            const blockBlobClient = this.containerClient.getBlockBlobClient(blobPath);
            const expiryTime = new Date();
            expiryTime.setMinutes(expiryTime.getMinutes() + expiryMinutes);
            const sasOptions = {
                containerName: this.containerClient.containerName,
                blobName: blobPath,
                permissions: storage_blob_1.BlobSASPermissions.parse('r'),
                startsOn: new Date(),
                expiresOn: expiryTime
                // Protocol is optional, so we'll omit it
            };
            const sasToken = (0, storage_blob_1.generateBlobSASQueryParameters)(sasOptions, sharedKeyCredential).toString();
            return `${blockBlobClient.url}?${sasToken}`;
        }
        catch (error) {
            console.error(`Error generating SAS URL for blob ${blobPath}:`, error);
            throw error;
        }
    }
    async listBlobs(prefix) {
        try {
            const blobs = [];
            for await (const blob of this.containerClient.listBlobsFlat({ prefix })) {
                blobs.push(blob.name);
            }
            return blobs;
        }
        catch (error) {
            console.error(`Error listing blobs with prefix ${prefix}:`, error);
            return [];
        }
    }
    async deleteBlob(blobPath) {
        try {
            const blockBlobClient = this.containerClient.getBlockBlobClient(blobPath);
            const response = await blockBlobClient.deleteIfExists();
            return response.succeeded;
        }
        catch (error) {
            console.error(`Error deleting blob ${blobPath}:`, error);
            return false;
        }
    }
}
exports.BlobStorageService = BlobStorageService;
//# sourceMappingURL=BlobStorageService.js.map