import * as core from '@actions/core';
import { getConfig } from './config';

export async function run(): Promise<void> {
    try {
        const config = getConfig();
        core.info(`Running Lighthouse for URL: ${config.url}`);
        core.info(`Performance threshold: ${config.threshold}`);
        core.info(`Device: ${config.device}`);

        //Run Lighthouse
        
        
        // Core functionality using config values
    } catch (error) {
        if (error instanceof Error) {
            core.setFailed(error.message);
        }
    }
}

// Add this to ensure the action runs
if (require.main === module) {
    run();
}