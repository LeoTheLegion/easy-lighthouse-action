import * as core from '@actions/core';

export async function runAction(): Promise<void> {
    try {
        // Core functionality of the GitHub Action goes here.
        core.info('GitHub Action is running...');
    } catch (error) {
        if (error instanceof Error) {
            core.setFailed(error.message);
        }
    }
}

// Add this to ensure the action runs
if (require.main === module) {
    runAction();
}