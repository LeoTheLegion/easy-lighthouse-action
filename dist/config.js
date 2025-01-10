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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfig = void 0;
const core = __importStar(require("@actions/core"));
function getConfig() {
    return {
        urls: core.getInput('urls', { required: true }),
        device: core.getInput('device') || 'mobile',
        apiKey: core.getInput('page_insights_key', { required: true }),
        performance_threshold: Number(core.getInput('performance_threshold')) || undefined,
        accessibility_threshold: Number(core.getInput('accessibility_threshold')) || undefined,
        best_practices_threshold: Number(core.getInput('best_practices_threshold')) || undefined,
        seo_threshold: Number(core.getInput('seo_threshold')) || undefined,
        mode: core.getInput('mode', { required: true }),
        sitemap_url: core.getInput('sitemap_url') || undefined
    };
}
exports.getConfig = getConfig;
