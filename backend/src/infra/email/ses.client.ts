import { SESClient } from '@aws-sdk/client-ses';
import { config } from '../../config';

export class SESClientManager {
    private static instance: SESClientManager | null = null;
    private client: SESClient;

    private constructor() {
        this.client = new SESClient({
            region: config.aws.region,
            credentials: {
                accessKeyId: config.aws.accessKeyId,
                secretAccessKey: config.aws.secretAccessKey,
            },
        });

        console.log('✅ SES client initialized');
    }

    public static getInstance(): SESClientManager {
        if (!SESClientManager.instance) {
            SESClientManager.instance = new SESClientManager();
        }
        return SESClientManager.instance;
    }

    public getClient(): SESClient {
        return this.client;
    }

    public close(): void {
        if (this.client) {
            this.client.destroy();
            SESClientManager.instance = null;
            console.log('✅ SES client closed');
        }
    }
}

// Export singleton instance and client for backward compatibility
export const sesClientManager = SESClientManager.getInstance();
export const sesClient = sesClientManager.getClient();
export const getSESClient = () => sesClient;
export const closeSESClient = () => sesClientManager.close();
