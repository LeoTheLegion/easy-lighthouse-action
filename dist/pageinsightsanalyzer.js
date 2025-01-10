"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const RequestQueue_1 = require("./RequestQueue");
const core = __importStar(require("@actions/core"));
const fast_xml_parser_1 = require("fast-xml-parser");
class PageInsightsAnalyzer {
    constructor(config) {
        this.PAGEINSIGHTSURL = "https://pagespeedonline.googleapis.com/pagespeedonline/v5/runPagespeed";
        this.REQUEST_PER_SECOND = 240 / 60;
        this.urls = [];
        this.IsReady = false;
        this._pgConfig = {
            device: config.device,
            apiKey: config.apiKey,
            performance_threshold: config.performance_threshold,
            accessibility_threshold: config.accessibility_threshold,
            best_practices_threshold: config.best_practices_threshold,
            seo_threshold: config.seo_threshold
        };
        if (config.mode === 'SITEMAP') {
            if (!config.sitemap_url) {
                throw new Error("sitemap_url is required when mode is SITEMAP");
            }
            core.info(`Fetching URLs from sitemap: ${config.sitemap_url}`);
            this.GetSiteMapUrls(config.sitemap_url).then((urls) => {
                this.urls = urls;
                core.info(`Found ${urls.length} URLs in sitemap`);
                this.IsReady = true;
            }).catch((error) => {
                throw new Error(error);
            });
        }
        else {
            if (!config.urls) {
                throw new Error("urls is required when mode is URL_LIST");
            }
            this.urls = config.urls.split(' ');
            this.IsReady = true;
        }
        this.requestQueue = new RequestQueue_1.RequestQueue(this.REQUEST_PER_SECOND);
    }
    // Run PageInsightsAnalyzer 
    Run() {
        return __awaiter(this, void 0, void 0, function* () {
            while (!this.IsReady) {
                //sleep for 10 ms
                yield new Promise(resolve => setTimeout(resolve, 10));
            }
            core.info(`Running PageInsights Analyzer with the following configuration:`);
            core.info(`Performance Threshold: ${this._pgConfig.performance_threshold || "N/A"}`);
            core.info(`Accessibility Threshold: ${this._pgConfig.accessibility_threshold || "N/A"}`);
            core.info(`Best Practices Threshold: ${this._pgConfig.best_practices_threshold || "N/A"}`);
            core.info(`SEO Threshold: ${this._pgConfig.seo_threshold || "N/A"}`);
            core.info(`Device: ${this._pgConfig.device}`);
            core.info(`API Key: ${this._pgConfig.apiKey}`);
            core.info(`Mode: ${this.urls.length} URLs to check`);
            core.info("****************************************************");
            var categories = [];
            if (this._pgConfig.performance_threshold) {
                categories.push('performance');
            }
            if (this._pgConfig.accessibility_threshold) {
                categories.push('accessibility');
            }
            if (this._pgConfig.best_practices_threshold) {
                categories.push('best-practices');
            }
            if (this._pgConfig.seo_threshold) {
                categories.push('seo');
            }
            var pageScores = [];
            for (let i = 0; i < this.urls.length; i++) {
                var scores = yield this.CheckPage(this.urls[i], categories);
                pageScores.push({
                    url: this.urls[i],
                    scores: scores
                });
            }
            //add up the scores
            var avgScores = {
                performance: 'N/A',
                accessibility: 'N/A',
                "best-practices": 'N/A',
                seo: 'N/A'
            };
            if (categories.includes('performance')) {
                avgScores.performance = (pageScores.reduce((acc, val) => acc + parseFloat(val.scores.performance), 0) / pageScores.length).toFixed(2);
                if (this._pgConfig.performance_threshold) {
                    var avgPerformance = parseFloat(avgScores.performance);
                    if (avgPerformance < this._pgConfig.performance_threshold) {
                        core.setFailed(`Performance threshold not met. Expected: ${this._pgConfig.performance_threshold}, Actual: ${avgPerformance}`);
                    }
                }
            }
            if (categories.includes('accessibility')) {
                avgScores.accessibility = (pageScores.reduce((acc, val) => acc + parseFloat(val.scores.accessibility), 0) / pageScores.length).toFixed(2);
                if (this._pgConfig.accessibility_threshold) {
                    var avgAccessibility = parseFloat(avgScores.accessibility);
                    if (avgAccessibility < this._pgConfig.accessibility_threshold) {
                        core.setFailed(`Accessibility threshold not met. Expected: ${this._pgConfig.accessibility_threshold}, Actual: ${avgAccessibility}`);
                    }
                }
            }
            if (categories.includes('best-practices')) {
                avgScores["best-practices"] = (pageScores.reduce((acc, val) => acc + parseFloat(val.scores["best-practices"]), 0) / pageScores.length).toFixed(2);
                if (this._pgConfig.best_practices_threshold) {
                    var avgBestPractices = parseFloat(avgScores["best-practices"]);
                    if (avgBestPractices < this._pgConfig.best_practices_threshold) {
                        core.setFailed(`Best Practices threshold not met. Expected: ${this._pgConfig.best_practices_threshold}, Actual: ${avgBestPractices}`);
                    }
                }
            }
            if (categories.includes('seo')) {
                avgScores.seo = (pageScores.reduce((acc, val) => acc + parseFloat(val.scores.seo), 0) / pageScores.length).toFixed(2);
                if (this._pgConfig.seo_threshold) {
                    var avgSEO = parseFloat(avgScores.seo);
                    if (avgSEO < this._pgConfig.seo_threshold) {
                        core.setFailed(`SEO threshold not met. Expected: ${this._pgConfig.seo_threshold}, Actual: ${avgSEO}`);
                    }
                }
            }
            core.info("Average Scores:");
            this.PrintScores(avgScores);
            core.info("****************************************************");
        });
    }
    // Get xml sitemap urls
    GetSiteMapUrls(sitemapUrl) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            // Fetch sitemap
            const response = yield fetch(sitemapUrl);
            const xmlContent = yield response.text();
            // Parse XML
            const parser = new fast_xml_parser_1.XMLParser({
                ignoreAttributes: false,
                parseTagValue: true
            });
            const result = parser.parse(xmlContent);
            const urls = [];
            // Handle standard sitemap
            if ((_a = result.urlset) === null || _a === void 0 ? void 0 : _a.url) {
                const urlList = Array.isArray(result.urlset.url)
                    ? result.urlset.url
                    : [result.urlset.url];
                urls.push(...urlList.map((u) => u.loc));
            }
            // Handle sitemap index
            if ((_b = result.sitemapindex) === null || _b === void 0 ? void 0 : _b.sitemap) {
                const sitemaps = Array.isArray(result.sitemapindex.sitemap)
                    ? result.sitemapindex.sitemap
                    : [result.sitemapindex.sitemap];
                for (const sitemap of sitemaps) {
                    const childUrls = yield this.GetSiteMapUrls(sitemap.loc);
                    urls.push(...childUrls);
                }
            }
            return urls;
        });
    }
    PrintScores(scores) {
        core.info(`\tPerformance: ${scores.performance}`);
        core.info(`\tAccessibility: ${scores.accessibility}`);
        core.info(`\tBest Practices: ${scores["best-practices"]}`);
        core.info(`\tSEO: ${scores.seo}`);
    }
    CheckPage(url, categories) {
        return __awaiter(this, void 0, void 0, function* () {
            core.info(`Querying PageInsights for URL: ${url}`);
            var scores = yield this.GetScoresFromPage(url, categories);
            return scores;
        });
    }
    GetScoresFromPage(url, categories) {
        return __awaiter(this, void 0, void 0, function* () {
            var r_scores = [];
            for (let i = 0; i < categories.length; i++) {
                r_scores.push(this.GetStats(url, categories[i]));
            }
            var score_Results = yield Promise.all(r_scores);
            var final_score = {
                performance: 'N/A',
                accessibility: 'N/A',
                "best-practices": 'N/A',
                seo: 'N/A'
            };
            score_Results.forEach(s => {
                final_score[s.category] = s.value.toString();
            });
            return final_score;
        });
    }
    GetStats(url, category) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.requestQueue.add(() => __awaiter(this, void 0, void 0, function* () {
                core.debug(`checking ${category} for ${url}`);
                const data = yield fetch(`${this.PAGEINSIGHTSURL}?url=${url}&strategy=${this._pgConfig.device}&category=${category}&key=${this._pgConfig.apiKey}`);
                const result = yield data.json();
                if (result.error) {
                    throw new Error(result.error.message);
                }
                return {
                    category: category,
                    value: result.lighthouseResult.categories[category].score * 100
                };
            }));
        });
    }
}
exports.default = PageInsightsAnalyzer;
