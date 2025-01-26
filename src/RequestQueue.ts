import { sleep } from "./helpers";

class Handler {
    request: () => Promise<any>;
    resolve: (value: any) => void;
    reject: (reason: any) => void;

    retry: number;

    constructor({
        request,
        resolve,
        reject,
    }: {
        request: () => Promise<any>;
        resolve: (value: any) => void;
        reject: (reason: any) => void;
    }) {
        this.request = request;
        this.resolve = resolve;
        this.reject = reject;
        this.retry = 3;
    }
}

export class RequestQueue {
    private queue: Array<Handler> = [];
    private processing = false;
    private readonly requestsPerSecond: number;

    constructor(requestsPerSecond: number = 1) {
        this.requestsPerSecond = requestsPerSecond;
    }

    async add<T>(request: () => Promise<T>): Promise<T> {
        return new Promise((resolve, reject) => {
            this.queue.push(new Handler({ request, resolve, reject }));
        });
    }

    public async process(): Promise<void> {
        if (this.processing) return;
        this.processing = true;

        const delayMs = Math.floor(1000 / this.requestsPerSecond);

        try {
            while (this.queue.length > 0) {
                const { request, resolve, reject, retry } = this.queue.shift()!;

                const executeWithRetry = async () => {
                    try {
                        const result = await request();
                        resolve(result);
                    } catch (error) {
                        if (retry > 0) {
                            // Re-queue with one less retry
                            this.queue.push({
                                request,
                                resolve,
                                reject,
                                retry: retry - 1,
                            });
                            console.warn(
                                `A request failed, retrying. ${
                                    retry - 1
                                } retries remaining`
                            );
                        } else {
                            // No more retries, reject the original promise
                            reject(error);
                        }
                    }
                };

                executeWithRetry();
                await sleep(delayMs);
            }
        } finally {
            this.processing = false;
        }
    }
}
