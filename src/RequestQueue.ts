import { sleep } from './helpers';

export class RequestQueue {
    private queue: Array<{
        request: () => Promise<any>;
        resolve: (value: any) => void;
        reject: (reason: any) => void;
    }> = [];
    private processing = false;
    private lastRequestTimes: number[] = [];
    private readonly requestsPerSecond: number;
    private readonly windowSize = 1000;
    private readonly minRequestDelay = 50; // minimum 50ms between requests

    constructor(requestsPerSecond: number = 1) {
        this.requestsPerSecond = requestsPerSecond;
    }

    async add<T>(request: () => Promise<T>): Promise<T> {
        return new Promise((resolve, reject) => {
            this.queue.push({ request, resolve, reject });
            this.process();
        });
    }

    private async process(): Promise<void> {
        if (this.processing) return;
        this.processing = true;

        try {
            while (this.queue.length > 0) {
                const now = Date.now();
                this.lastRequestTimes = this.lastRequestTimes.filter(
                    time => now - time < this.windowSize
                );

                if (this.lastRequestTimes.length >= this.requestsPerSecond) {
                    const waitTime = this.windowSize - (now - this.lastRequestTimes[0]);
                    await sleep(Math.max(0, waitTime));
                    continue;
                }

                const available = this.requestsPerSecond - this.lastRequestTimes.length;
                const batchSize = Math.min(available, this.queue.length);
                const batch = this.queue.splice(0, batchSize);

                await Promise.all(
                    batch.map(async ({ request, resolve, reject }, index) => {
                        try {
                            // Add minimum delay between requests
                            const staggerDelay = Math.max(
                                this.minRequestDelay,
                                (index * this.windowSize) / this.requestsPerSecond
                            );
                            await sleep(staggerDelay);
                            
                            this.lastRequestTimes.push(Date.now());
                            const result = await request();
                            resolve(result);
                        } catch (error) {
                            reject(error);
                        }
                    })
                );
                
                // Add small delay after each batch
                await sleep(this.minRequestDelay);
            }
        } finally {
            this.processing = false;
        }
    }
}