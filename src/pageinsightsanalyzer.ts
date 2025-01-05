import { ActionConfig } from './types';
import * as core from '@actions/core';

interface PGConfig {
    threshold: number;
    device?: 'mobile' | 'desktop';
    apiKey: string;
}

interface Score{
    category: string;
    value: number;
}

interface FullScore {
    performance: string;
    accessibility: string;
    "best-practices": string;
    seo: string;
}

export default class PageInsightsAnalyzer {

    private readonly PAGEINSIGHTSURL = "https://pagespeedonline.googleapis.com/pagespeedonline/v5/runPagespeed"
    private _pgConfig: PGConfig;

    constructor() {
        this._pgConfig = {
            threshold: 0,
            device: 'mobile',
            apiKey: ''
        }
    }
    // Run PageInsightsAnalyzer 
    async Run(config: ActionConfig) {

        this._pgConfig = {
            threshold: config.threshold,
            device: config.device,
            apiKey: config.apiKey
        }
        core.info("****************************************************");
        core.info(`Querying PageInsights for URL: ${config.url}`);

        var scores = await this.GetScoresFromPage(config.url, ['performance', 'accessibility', 'best-practices', 'seo']);

        core.info(`\tPerformance: ${scores.performance}`);
        core.info(`\tAccessibility: ${scores.accessibility}`);
        core.info(`\tBest Practices: ${scores["best-practices"]}`);
        core.info(`\tSEO: ${scores.seo}`);

        core.info("****************************************************");
    }

    private async GetScoresFromPage(url: string, categories: string[]) {
        var r_scores = [];
        for (let i = 0; i < categories.length; i++) {
            r_scores.push(this.GetStats(url, categories[i]));
        }

        var score_Results = await Promise.all(r_scores);

        var final_score : FullScore = {
            performance: 'N/A',
            accessibility: 'N/A',
            "best-practices": 'N/A',
            seo: 'N/A'
        }

        score_Results.forEach(s => {
            final_score[s.category as keyof FullScore] = s.value.toString();
        });

        return final_score;
    }

    private async GetStats(url:string, category: string) : Promise<Score> {
        var data = await fetch(`${this.PAGEINSIGHTSURL}?url=${url}&strategy=${this._pgConfig.device}&category=${category}&key=${this._pgConfig.apiKey}`);
        var result = await data.json();
        return {
            category: category,
            value: result.lighthouseResult.categories[category].score * 100
        };
    }

}