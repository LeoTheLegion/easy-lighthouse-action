import { RequestQueue } from "./RequestQueue";
import { ActionConfig } from "./types";
import * as core from "@actions/core";
import { XMLParser } from "fast-xml-parser";

interface PGConfig {
    device?: "mobile" | "desktop";
    apiKey: string;
    performance_threshold?: number;
    accessibility_threshold?: number;
    best_practices_threshold?: number;
    seo_threshold?: number;
    show_table_in_summary?: boolean;
}

interface Score {
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
    private readonly PAGEINSIGHTSURL =
        "https://pagespeedonline.googleapis.com/pagespeedonline/v5/runPagespeed";
    private _pgConfig: PGConfig;

    private readonly REQUEST_PER_SECOND = 240 / 60;
    private requestQueue: RequestQueue;
    private urls: string[] = [];
    private IsReady: boolean = false;

    constructor(config: ActionConfig) {
        this._pgConfig = {
            device: config.device,
            apiKey: config.apiKey,
            performance_threshold: config.performance_threshold,
            accessibility_threshold: config.accessibility_threshold,
            best_practices_threshold: config.best_practices_threshold,
            seo_threshold: config.seo_threshold,
            show_table_in_summary: config.show_table_in_summary,
        };

        if (config.mode === "SITEMAP") {
            if (!config.sitemap_url) {
                throw new Error("sitemap_url is required when mode is SITEMAP");
            }
            core.info(`Fetching URLs from sitemap: ${config.sitemap_url}`);
            this.GetSiteMapUrls(config.sitemap_url)
                .then((urls) => {
                    this.urls = urls;
                    core.info(`Found ${urls.length} URLs in sitemap`);
                    this.IsReady = true;
                })
                .catch((error) => {
                    throw new Error(error);
                });
        } else {
            if (!config.urls) {
                throw new Error("urls is required when mode is URL_LIST");
            }
            //split the urls by new line and trim them
            this.urls = config.urls.split("\n").map((url) => url.trim());
            this.IsReady = true;
        }

        this.requestQueue = new RequestQueue(this.REQUEST_PER_SECOND);
    }
    // Run PageInsightsAnalyzer
    async Run() {
        while (!this.IsReady) {
            //sleep for 10 ms
            await new Promise((resolve) => setTimeout(resolve, 10));
        }

        core.info(
            `Running PageInsights Analyzer with the following configuration:`
        );

        core.info(
            `Performance Threshold: ${
                this._pgConfig.performance_threshold || "N/A"
            }`
        );
        core.info(
            `Accessibility Threshold: ${
                this._pgConfig.accessibility_threshold || "N/A"
            }`
        );
        core.info(
            `Best Practices Threshold: ${
                this._pgConfig.best_practices_threshold || "N/A"
            }`
        );
        core.info(`SEO Threshold: ${this._pgConfig.seo_threshold || "N/A"}`);
        core.info(`Device: ${this._pgConfig.device}`);
        core.info(`API Key: ${this._pgConfig.apiKey}`);
        core.info(`Mode: ${this.urls.length} URLs to check`);

        core.info("****************************************************");

        var categories = [];

        if (this._pgConfig.performance_threshold) {
            categories.push("performance");
        }

        if (this._pgConfig.accessibility_threshold) {
            categories.push("accessibility");
        }

        if (this._pgConfig.best_practices_threshold) {
            categories.push("best-practices");
        }

        if (this._pgConfig.seo_threshold) {
            categories.push("seo");
        }

        var pageScores: PageScore[] = [];

        var scoresPromises = [];

        for (let i = 0; i < this.urls.length; i++) {
            var scoresPromise = this.CheckPage(this.urls[i], categories);
            scoresPromises.push(scoresPromise);
        }

        this.requestQueue.process();

        var scores : FullScore[] = await Promise.all(scoresPromises);
        
        for (let i = 0; i < this.urls.length; i++) {
            pageScores.push({
                url: this.urls[i],
                scores: scores[i],
            });
        }

        //add up the scores
        var avgScores: FullScore = {
            performance: "N/A",
            accessibility: "N/A",
            "best-practices": "N/A",
            seo: "N/A",
        };

        if (categories.includes("performance")) {
            avgScores.performance = (
                pageScores.reduce(
                    (acc, val) => acc + parseFloat(val.scores.performance),
                    0
                ) / pageScores.length
            ).toFixed(2);

            if (this._pgConfig.performance_threshold) {
                var avgPerformance = parseFloat(avgScores.performance);
                if (avgPerformance < this._pgConfig.performance_threshold) {
                    core.setFailed(
                        `Performance threshold not met. Expected: ${this._pgConfig.performance_threshold}, Actual: ${avgPerformance}`
                    );
                }
            }
        }

        if (categories.includes("accessibility")) {
            avgScores.accessibility = (
                pageScores.reduce(
                    (acc, val) => acc + parseFloat(val.scores.accessibility),
                    0
                ) / pageScores.length
            ).toFixed(2);

            if (this._pgConfig.accessibility_threshold) {
                var avgAccessibility = parseFloat(avgScores.accessibility);
                if (avgAccessibility < this._pgConfig.accessibility_threshold) {
                    core.setFailed(
                        `Accessibility threshold not met. Expected: ${this._pgConfig.accessibility_threshold}, Actual: ${avgAccessibility}`
                    );
                }
            }
        }

        if (categories.includes("best-practices")) {
            avgScores["best-practices"] = (
                pageScores.reduce(
                    (acc, val) =>
                        acc + parseFloat(val.scores["best-practices"]),
                    0
                ) / pageScores.length
            ).toFixed(2);

            if (this._pgConfig.best_practices_threshold) {
                var avgBestPractices = parseFloat(avgScores["best-practices"]);
                if (
                    avgBestPractices < this._pgConfig.best_practices_threshold
                ) {
                    core.setFailed(
                        `Best Practices threshold not met. Expected: ${this._pgConfig.best_practices_threshold}, Actual: ${avgBestPractices}`
                    );
                }
            }
        }

        if (categories.includes("seo")) {
            avgScores.seo = (
                pageScores.reduce(
                    (acc, val) => acc + parseFloat(val.scores.seo),
                    0
                ) / pageScores.length
            ).toFixed(2);

            if (this._pgConfig.seo_threshold) {
                var avgSEO = parseFloat(avgScores.seo);
                if (avgSEO < this._pgConfig.seo_threshold) {
                    core.setFailed(
                        `SEO threshold not met. Expected: ${this._pgConfig.seo_threshold}, Actual: ${avgSEO}`
                    );
                }
            }
        }

        core.info("Average Scores:");
        this.PrintScores(avgScores);

        core.info("****************************************************");

        //output the scores as json object for actions to use
        core.setOutput("scores", JSON.stringify(pageScores));

        //output the average scores as json object for actions to use
        core.setOutput("average_scores", JSON.stringify(avgScores));

        //print the scores as table
        if (this._pgConfig.show_table_in_summary) {
            await this.printPageScoresAsTable(pageScores);
        }
    }

    // Get xml sitemap urls
    private async GetSiteMapUrls(sitemapUrl: string) {
        // Fetch sitemap
        const response = await fetch(sitemapUrl);
        const xmlContent = await response.text();

        // Parse XML
        const parser = new XMLParser({
            ignoreAttributes: false,
            parseTagValue: true,
        });
        const result = parser.parse(xmlContent);

        const urls: string[] = [];

        // Handle standard sitemap
        if (result.urlset?.url) {
            const urlList = Array.isArray(result.urlset.url)
                ? result.urlset.url
                : [result.urlset.url];

            urls.push(...urlList.map((u: { loc: any }) => u.loc));
        }

        // Handle sitemap index
        if (result.sitemapindex?.sitemap) {
            const sitemaps = Array.isArray(result.sitemapindex.sitemap)
                ? result.sitemapindex.sitemap
                : [result.sitemapindex.sitemap];

            for (const sitemap of sitemaps) {
                const childUrls = await this.GetSiteMapUrls(sitemap.loc);
                urls.push(...childUrls);
            }
        }

        return urls;
    }

    private PrintScores(scores: FullScore) {
        core.info(`\tPerformance: ${scores.performance}`);
        core.info(`\tAccessibility: ${scores.accessibility}`);
        core.info(`\tBest Practices: ${scores["best-practices"]}`);
        core.info(`\tSEO: ${scores.seo}`);
    }

    private async CheckPage(
        url: string,
        categories: string[]
    ): Promise<FullScore> {
        var scores = await this.GetScoresFromPage(url, categories);
        core.info(`Finished PageInsights for URL: ${url}`);

        return scores;
    }

    private async GetScoresFromPage(url: string, categories: string[]) {
        var r_scores = [];
        for (let i = 0; i < categories.length; i++) {
            r_scores.push(this.GetStats(url, categories[i]));
        }

        var score_Results = await Promise.all(r_scores);

        var final_score: FullScore = {
            performance: "N/A",
            accessibility: "N/A",
            "best-practices": "N/A",
            seo: "N/A",
        };

        score_Results.forEach((s) => {
            final_score[s.category as keyof FullScore] = s.value.toString();
        });

        return final_score;
    }

    private async GetStats(url: string, category: string): Promise<Score> {
        return this.requestQueue.add(async () => {
            core.debug(`Checking ${category} for ${url}`);
            const data = await fetch(
                `${this.PAGEINSIGHTSURL}?url=${url}&strategy=${this._pgConfig.device}&category=${category}&key=${this._pgConfig.apiKey}`
            );
            const result = await data.json();

            if (result.error) {
                throw new Error(JSON.stringify(result.error));
            }

            return {
                category: category,
                value: result.lighthouseResult.categories[category].score * 100,
            };
        });
    }

    private async printPageScoresAsTable(pageScores: PageScore[]) {
        const thresholds = {
            performance: this._pgConfig.performance_threshold,
            accessibility: this._pgConfig.accessibility_threshold,
            "best-practices": this._pgConfig.best_practices_threshold,
            seo: this._pgConfig.seo_threshold,
        };

        // Define score types and their corresponding threshold keys
        const scoreTypes = [
            { key: "performance", label: "Performance" },
            { key: "accessibility", label: "Accessibility" },
            { key: "best-practices", label: "Best Practices" },
            { key: "seo", label: "SEO" },
        ];

        // Filter headers based on non-null thresholds
        const activeScoreTypes = scoreTypes.filter(
            (type) => thresholds[type.key as keyof typeof thresholds] !== undefined
        );

        // Create headers
        const headers = [
            { data: "URL", header: true },
            ...activeScoreTypes.map((type) => ({
                data: type.label,
                header: true,
            })),
        ];

        // Create rows
        const rows = pageScores.map((score) => [
            score.url,
            ...activeScoreTypes.map((type) => {
                const value = type.key === "best-practices"
                    ? score.scores["best-practices"]
                    : score.scores[type.key as keyof FullScore];
                const threshold = thresholds[type.key as keyof typeof thresholds];
                const indicator = this.getScoreIndicator(value, threshold ?? 0);
                return `${value} ${indicator}`;
            }),
        ]);

        await core.summary
            .addHeading("Lighthouse Scores")
            .addTable([headers, ...rows])
            .write();
    }

    private getScoreIndicator(score: string, threshold: number): string {
        const scoreValue = parseFloat(score);
        const margin = 5;

        // If the score is 100, it's a pass
        if (scoreValue == 100) return "✅";
        
        // If the score is less than the threshold, it's a fail
        if (scoreValue < threshold) return "❌";

        // If the score is within the margin of the threshold, it's a warning
        if (scoreValue <= threshold + margin) return "⚠️";

        // Otherwise, it's a pass
        return "✅";
    }
}
