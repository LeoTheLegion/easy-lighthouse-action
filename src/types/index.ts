// This file exports TypeScript interfaces that define the structure of the inputs and outputs for the action.

export interface ActionConfig {
    url: string;
    threshold: number;
    device?: 'mobile' | 'desktop';
    apiKey: string;
}