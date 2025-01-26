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

            // If the error is due to the environment 
            // not supporting job summaries, ignore it
            if (error.message === 'Unable to find environment variable for $GITHUB_STEP_SUMMARY. Check if your runtime environment supports job summaries.')
                return;

            core.setFailed(error.message);
        }
    }
}

// Add this to ensure the action runs
if (require.main === module) {
    run();
}