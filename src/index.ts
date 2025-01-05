import * as core from '@actions/core';
import { getConfig } from './config';
import PageInsightsAnalyzer from './pageinsightsanalyzer';

export async function run(): Promise<void> {
    try {
        const config = getConfig();

        //Run Lighthouse
        const lighthouse = new PageInsightsAnalyzer(config);
        await lighthouse.Run();
        
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