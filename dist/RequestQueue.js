"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestQueue = void 0;
const helpers_1 = require("./helpers");
class RequestQueue {
    constructor(requestsPerSecond = 1) {
        this.queue = [];
        this.processing = false;
        this.lastRequestTimes = [];
        this.windowSize = 1000;
        this.minRequestDelay = 50; // minimum 50ms between requests
        this.requestsPerSecond = requestsPerSecond;
    }
    add(request) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.queue.push({ request, resolve, reject });
                this.process();
            });
        });
    }
    process() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.processing)
                return;
            this.processing = true;
            try {
                while (this.queue.length > 0) {
                    const now = Date.now();
                    this.lastRequestTimes = this.lastRequestTimes.filter(time => now - time < this.windowSize);
                    if (this.lastRequestTimes.length >= this.requestsPerSecond) {
                        const waitTime = this.windowSize - (now - this.lastRequestTimes[0]);
                        yield (0, helpers_1.sleep)(Math.max(0, waitTime));
                        continue;
                    }
                    const available = this.requestsPerSecond - this.lastRequestTimes.length;
                    const batchSize = Math.min(available, this.queue.length);
                    const batch = this.queue.splice(0, batchSize);
                    yield Promise.all(batch.map(({ request, resolve, reject }, index) => __awaiter(this, void 0, void 0, function* () {
                        try {
                            // Add minimum delay between requests
                            const staggerDelay = Math.max(this.minRequestDelay, (index * this.windowSize) / this.requestsPerSecond);
                            yield (0, helpers_1.sleep)(staggerDelay);
                            this.lastRequestTimes.push(Date.now());
                            const result = yield request();
                            resolve(result);
                        }
                        catch (error) {
                            reject(error);
                        }
                    })));
                    // Add small delay after each batch
                    yield (0, helpers_1.sleep)(this.minRequestDelay);
                }
            }
            finally {
                this.processing = false;
            }
        });
    }
}
exports.RequestQueue = RequestQueue;
