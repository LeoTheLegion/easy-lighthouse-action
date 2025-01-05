import { RequestQueue } from './RequestQueue';
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

interface PageScore {
    url: string;
    scores: FullScore;
}

export default class PageInsightsAnalyzer {

    private readonly PAGEINSIGHTSURL = "https://pagespeedonline.googleapis.com/pagespeedonline/v5/runPagespeed"
    private _pgConfig: PGConfig;

    private readonly REQUEST_PER_SECOND = 240/60;
    private requestQueue: RequestQueue;
    private urls : string[] = [];


    constructor(config: ActionConfig) {
        this._pgConfig = {
            threshold: config.threshold,
            device: config.device,
            apiKey: config.apiKey
        }

        this.urls = config.urls.split(' ');

        this.requestQueue = new RequestQueue(this.REQUEST_PER_SECOND);
    }
    // Run PageInsightsAnalyzer 
    async Run() {

        core.info(`Running PageInsights Analyzer with the following configuration:`);
        core.info(`Performance threshold: ${this._pgConfig.threshold}`);
        core.info(`Device: ${this._pgConfig.device}`);
        core.info(`API Key: ${this._pgConfig.apiKey}`);
        core.info(`URLs: ${this.urls}`);

        
        core.info("****************************************************");

        var categories = ['performance', 'accessibility', 'best-practices', 'seo'];

        var pageScores: PageScore[] = [];

        for (let i = 0; i < this.urls.length; i++) {
            var scores = await this.CheckPage(this.urls[i], categories);
            pageScores.push({
                url: this.urls[i],
                scores: scores
            });
        }

        //add up the scores
        var avgScores: FullScore = {
            performance: '0',
            accessibility: '0',
            "best-practices": '0',
            seo: '0'
        }

        if(categories.includes('performance')) {
            avgScores.performance = (pageScores.reduce((acc, val) => acc + parseFloat(val.scores.performance), 0) / pageScores.length).toFixed(2);
        }

        if(categories.includes('accessibility')) {
            avgScores.accessibility = (pageScores.reduce((acc, val) => acc + parseFloat(val.scores.accessibility), 0) / pageScores.length).toFixed(2);
        }

        if(categories.includes('best-practices')) {
            avgScores["best-practices"] = (pageScores.reduce((acc, val) => acc + parseFloat(val.scores["best-practices"]), 0) / pageScores.length).toFixed(2);
        }

        if(categories.includes('seo')) {
            avgScores.seo = (pageScores.reduce((acc, val) => acc + parseFloat(val.scores.seo), 0) / pageScores.length).toFixed(2);
        }

        core.info("Average Scores:");
        this.PrintScores(avgScores);
        
        core.info("****************************************************");
    }

    private PrintScores(scores: FullScore) {
        core.info(`\tPerformance: ${scores.performance}`);
        core.info(`\tAccessibility: ${scores.accessibility}`);
        core.info(`\tBest Practices: ${scores["best-practices"]}`);
        core.info(`\tSEO: ${scores.seo}`);
    }

    private async CheckPage(url: string, categories: string[]) : Promise<FullScore> {
        core.info(`Querying PageInsights for URL: ${url}`);
        var scores = await this.GetScoresFromPage(url, categories);

        return scores;
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
        return this.requestQueue.add(async () => {
            core.info(`checking ${category} for ${url}`);
            const data = await fetch(`${this.PAGEINSIGHTSURL}?url=${url}&strategy=${this._pgConfig.device}&category=${category}&key=${this._pgConfig.apiKey}`);
            const result = await data.json();

            if (result.error) {
                throw new Error(result.error.message);
            }

            return {
                category: category,
                value: result.lighthouseResult.categories[category].score * 100
            };
        });
    }

}