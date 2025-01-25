import { sleep } from './helpers';

export class RequestQueue {
    private queue: Array<{
        request: () => Promise<any>;
        resolve: (value: any) => void;
        reject: (reason: any) => void;
    }> = [];
    private processing = false;
    private readonly requestsPerSecond: number;

    constructor(requestsPerSecond: number = 1) {
        this.requestsPerSecond = requestsPerSecond;
    }

    async add<T>(request: () => Promise<T>): Promise<T> {
        return new Promise((resolve, reject) => {
            this.queue.push({ request, resolve, reject });
        });
    }

    public async process(): Promise<void> {
        if (this.processing) return;
        this.processing = true;

        const delayMs = Math.floor(1000 / this.requestsPerSecond);

        try {
            while (this.queue.length > 0) {
                const { request, resolve, reject } = this.queue.shift()!;
                
                request()
                    .then(resolve)
                    .catch(reject);

                await sleep(delayMs);
            }
        } finally {
            this.processing = false;
        }
    }
}