[![PageInsights CI](https://github.com/LeoTheLegion/easy-lighthouse-action/actions/workflows/main.yml/badge.svg)](https://github.com/LeoTheLegion/easy-lighthouse-action/actions/workflows/main.yml)

# Page Insights Action

This project is a custom GitHub Action that runs Google Page Insights on a list of URLs or a sitemap.

## Overview

This GitHub Action is designed to perform Google Page Insights audits. Depending on your thresholds, the action will pass or fail. **It requires a Google Page Insights API key**.

## Getting Started

To use this action in your GitHub workflows, follow these steps:

1. **Create a new workflow file** in your repository (if you haven't already) under `.github/workflows/`.
2. **Reference this action** in your workflow YAML file:

   ```yaml
   jobs:
     example-job:
       runs-on: ubuntu-latest
       steps:
         - name: Run Page Insights Action
           uses: leothelegion/easy-lighthouse-action@v0.4.1
           with:
             device: 'mobile'
             page_insights_key: ${{ secrets.PAGE_INSIGHTS_KEY }}
             performance_threshold: 90
             seo_threshold: 90
             accessibility_threshold: 90
             best_practices_threshold: 90
             mode: 'MANUAL'
             urls: |
               https://example.com
               https://example2.com
   ```

3. **Configure inputs** as needed based on the action's requirements.

## Inputs

| Input                      | Description                             | Required |
|----------------------------|-----------------------------------------|----------|
| `urls`                     | URLs to audit (separated by new lines)  | Yes      |
| `device`                   | Device to emulate (mobile/desktop)      | Yes      |
| `page_insights_key`        | Google Page Insights API key            | Yes      |
| `performance_threshold`    | Performance threshold                   | No       |
| `seo_threshold`            | SEO threshold                           | No       |
| `accessibility_threshold`  | Accessibility threshold                 | No       |
| `best_practices_threshold` | Best practices threshold                | No       |
| `mode`                     | Mode to run the audit in                | Yes      |
| `sitemap_url`              | Sitemap URL                             | No       |

### Device Options

- `MOBILE`
- `DESKTOP`

### Mode Options

- `SITEMAP`
- `MANUAL`

## Outputs

| Output           | Description                        |
|------------------|------------------------------------|
| `scores`         | Scores for each URL                |
| `average_scores` | Average scores for all URLs        |

### Example of `scores` Output

```json
[
  {
    "url": "https://example.com",
    "scores": {
      "performance": "100",
      "accessibility": "100",
      "best-practices": "96",
      "seo": "100"
    }
  }
]
```

### Example of `average_scores` Output

```json
{
  "performance": "100.00",
  "accessibility": "100.00",
  "best-practices": "96.00",
  "seo": "100.00"
}
```

## Examples

### Using SITEMAP Mode

```yaml
jobs:
  example-job:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v2
      - name: Run Page Insights Action
        uses: leothelegion/easy-lighthouse-action@v0.4.1
        with:
          device: 'mobile'
          page_insights_key: ${{ secrets.PAGE_INSIGHTS_KEY }}
          performance_threshold: 90
          seo_threshold: 90
          accessibility_threshold: 90
          best_practices_threshold: 90
          mode: 'SITEMAP'
          sitemap_url: 'https://example.com/sitemap.xml'
```

### Using MANUAL Mode

```yaml
jobs:
  example-job:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v2
      - name: Run Page Insights Action
        uses: leothelegion/easy-lighthouse-action@v0.4.1
        with:
          urls: |
            https://example.com
            https://example2.com
          device: 'mobile'
          page_insights_key: ${{ secrets.PAGE_INSIGHTS_KEY }}
          performance_threshold: 90
          seo_threshold: 90
          accessibility_threshold: 90
          best_practices_threshold: 90
          mode: 'MANUAL'
```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.
