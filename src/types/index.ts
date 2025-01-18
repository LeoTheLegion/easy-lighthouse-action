// This file exports TypeScript interfaces that define the structure of the inputs and outputs for the action.

export interface ActionConfig {
    urls?: string;
    device?: 'mobile' | 'desktop';
    apiKey: string;
    performance_threshold?: number;
    accessibility_threshold?: number;
    best_practices_threshold?: number;
    seo_threshold?: number;
    mode: 'SITEMAP' | 'URL_LIST';
    sitemap_url?: string;
    show_table?: boolean;
}