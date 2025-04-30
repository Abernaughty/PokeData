export interface IBlobStorageService {
    exists(blobPath: string): Promise<boolean>;
    uploadBlob(blobPath: string, content: Buffer | string, contentType?: string): Promise<string>;
    downloadBlob(blobPath: string): Promise<Buffer | null>;
    generateSasUrl(blobPath: string, expiryMinutes?: number): Promise<string>;
    listBlobs(prefix: string): Promise<string[]>;
    deleteBlob(blobPath: string): Promise<boolean>;
}

export class BlobStorageService implements IBlobStorageService {
    private connectionString: string;
    private containerName: string = 'cards';
    
    constructor(connectionString: string, containerName?: string) {
        this.connectionString = connectionString;
        if (containerName) {
            this.containerName = containerName;
        }
    }
    
    async exists(blobPath: string): Promise<boolean> {
        console.log(`[BlobStorageService] Checking if blob exists: ${blobPath}`);
        
        // Mock implementation for local testing
        return false;
    }
    
    async uploadBlob(blobPath: string, content: Buffer | string, contentType?: string): Promise<string> {
        console.log(`[BlobStorageService] Uploading blob: ${blobPath}`);
        
        // Mock implementation for local testing
        return `http://localhost:10000/devstoreaccount1/${this.containerName}/${blobPath}`;
    }
    
    async downloadBlob(blobPath: string): Promise<Buffer | null> {
        console.log(`[BlobStorageService] Downloading blob: ${blobPath}`);
        
        // Mock implementation for local testing
        return null;
    }
    
    async generateSasUrl(blobPath: string, expiryMinutes: number = 60): Promise<string> {
        console.log(`[BlobStorageService] Generating SAS URL for blob: ${blobPath} with expiry: ${expiryMinutes} minutes`);
        
        // Mock implementation for local testing
        return `http://localhost:10000/devstoreaccount1/${this.containerName}/${blobPath}?sv=2020-08-04&ss=b&srt=co&sp=r&se=${Date.now() + expiryMinutes * 60 * 1000}&st=${Date.now()}&spr=https&sig=mock-signature`;
    }
    
    async listBlobs(prefix: string): Promise<string[]> {
        console.log(`[BlobStorageService] Listing blobs with prefix: ${prefix}`);
        
        // Mock implementation for local testing
        return [];
    }
    
    async deleteBlob(blobPath: string): Promise<boolean> {
        console.log(`[BlobStorageService] Deleting blob: ${blobPath}`);
        
        // Mock implementation for local testing
        return true;
    }
}
