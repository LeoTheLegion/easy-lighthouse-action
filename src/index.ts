import * as core from '@actions/core';
import { getConfig } from './config';
import PageInsightsAnalyzer from './pageinsightsanalyzer';

export async function run(): Promise<void> {
    try {
        const config = getConfig();
        core.info(`Running PageInsights for site: ${config.url}`);
        core.info(`Performance threshold: ${config.threshold}`);
        core.info(`Device: ${config.device}`);
        core.info(`API Key: ${config.apiKey}`);

        //Run Lighthouse
        const lighthouse = new PageInsightsAnalyzer();
        await lighthouse.Run(config);
        
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