import { RequestQueue } from './RequestQueue';
import { ActionConfig } from './types';
import * as core from '@actions/core';

interface PGConfig {
    device?: 'mobile' | 'desktop';
    apiKey: string;
    performance_threshold?: number;
    accessibility_threshold?: number;
    best_practices_threshold?: number;
    seo_threshold?: number;
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
            device: config.device,
            apiKey: config.apiKey,
            performance_threshold: config.performance_threshold,
            accessibility_threshold: config.accessibility_threshold,
            best_practices_threshold: config.best_practices_threshold,
            seo_threshold: config.seo_threshold
        }

        this.urls = config.urls.split(' ');

        this.requestQueue = new RequestQueue(this.REQUEST_PER_SECOND);
    }
    // Run PageInsightsAnalyzer 
    async Run() {

        core.info(`Running PageInsights Analyzer with the following configuration:`);
        
        core.info(`Performance Threshold: ${this._pgConfig.performance_threshold || "N/A"}`);
        core.info(`Accessibility Threshold: ${this._pgConfig.accessibility_threshold || "N/A"}`);
        core.info(`Best Practices Threshold: ${this._pgConfig.best_practices_threshold || "N/A"}`);
        core.info(`SEO Threshold: ${this._pgConfig.seo_threshold || "N/A"}`);
        core.info(`Device: ${this._pgConfig.device}`);
        core.info(`API Key: ${this._pgConfig.apiKey}`);
        core.info(`URLs: ${this.urls}`);

        
        core.info("****************************************************");

        var categories = [];

        if(this._pgConfig.performance_threshold) {
            categories.push('performance');
        }

        if(this._pgConfig.accessibility_threshold) {
            categories.push('accessibility');
        }

        if(this._pgConfig.best_practices_threshold) {
            categories.push('best-practices');
        }

        if(this._pgConfig.seo_threshold) {
            categories.push('seo');
        }

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
            performance: 'N/A',
            accessibility: 'N/A',
            "best-practices": 'N/A',
            seo: 'N/A'
        }

        if(categories.includes('performance')) {
            avgScores.performance = (pageScores.reduce((acc, val) => acc + parseFloat(val.scores.performance), 0) / pageScores.length).toFixed(2);

            if(this._pgConfig.performance_threshold) {
                var avgPerformance = parseFloat(avgScores.performance);
                if(avgPerformance < this._pgConfig.performance_threshold) {
                    core.setFailed(`Performance threshold not met. Expected: ${this._pgConfig.performance_threshold}, Actual: ${avgPerformance}`);
                }
            }
        }

        if(categories.includes('accessibility')) {
            avgScores.accessibility = (pageScores.reduce((acc, val) => acc + parseFloat(val.scores.accessibility), 0) / pageScores.length).toFixed(2);

            if(this._pgConfig.accessibility_threshold) {
                var avgAccessibility = parseFloat(avgScores.accessibility);
                if(avgAccessibility < this._pgConfig.accessibility_threshold) {
                    core.setFailed(`Accessibility threshold not met. Expected: ${this._pgConfig.accessibility_threshold}, Actual: ${avgAccessibility}`);
                }
            }
        }

        if(categories.includes('best-practices')) {
            avgScores["best-practices"] = (pageScores.reduce((acc, val) => acc + parseFloat(val.scores["best-practices"]), 0) / pageScores.length).toFixed(2);

            if(this._pgConfig.best_practices_threshold) {
                var avgBestPractices = parseFloat(avgScores["best-practices"]);
                if(avgBestPractices < this._pgConfig.best_practices_threshold) {
                    core.setFailed(`Best Practices threshold not met. Expected: ${this._pgConfig.best_practices_threshold}, Actual: ${avgBestPractices}`);
                }
            }
        }

        if(categories.includes('seo')) {
            avgScores.seo = (pageScores.reduce((acc, val) => acc + parseFloat(val.scores.seo), 0) / pageScores.length).toFixed(2);

            if(this._pgConfig.seo_threshold) {
                var avgSEO = parseFloat(avgScores.seo);
                if(avgSEO < this._pgConfig.seo_threshold) {
                    core.setFailed(`SEO threshold not met. Expected: ${this._pgConfig.seo_threshold}, Actual: ${avgSEO}`);
                }
            }
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