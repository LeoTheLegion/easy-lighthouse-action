import * as core from '@actions/core';
import { ActionConfig } from './types';

export function getConfig(): ActionConfig {
    return {
        url: core.getInput('url', { required: true }),
        threshold: Number(core.getInput('threshold')) || 90,
        device: core.getInput('device') as 'mobile' | 'desktop' || 'mobile',
        apiKey : core.getInput('page-insights-key', { required: true })
    };
}