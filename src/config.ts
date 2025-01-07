import * as core from '@actions/core';
import { ActionConfig } from './types';

export function getConfig(): ActionConfig {
    return {
        urls: core.getInput('urls', { required: true }),
        device: core.getInput('device') as 'mobile' | 'desktop' || 'mobile',
        apiKey : core.getInput('page_insights_key', { required: true }),
        performance_threshold: Number(core.getInput('performance_threshold')) || undefined,
        accessibility_threshold: Number(core.getInput('accessibility_threshold')) || undefined,
        best_practices_threshold: Number(core.getInput('best_practices_threshold')) || undefined,
        seo_threshold: Number(core.getInput('seo_threshold')) || undefined
    };
}