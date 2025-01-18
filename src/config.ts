import * as core from '@actions/core';
import { ActionConfig } from './types';

export function getConfig(): ActionConfig {
    return {
        urls: core.getInput('urls'),
        device: core.getInput('device',{ required: true }) as 'mobile' | 'desktop',
        apiKey : core.getInput('page_insights_key', { required: true }),
        performance_threshold: Number(core.getInput('performance_threshold')) || undefined,
        accessibility_threshold: Number(core.getInput('accessibility_threshold')) || undefined,
        best_practices_threshold: Number(core.getInput('best_practices_threshold')) || undefined,
        seo_threshold: Number(core.getInput('seo_threshold')) || undefined,
        mode: core.getInput('mode', { required: true }) as 'SITEMAP' | 'URL_LIST',
        sitemap_url: core.getInput('sitemap_url') || undefined,
        show_table: core.getInput('show_table') === 'true'
    };
}