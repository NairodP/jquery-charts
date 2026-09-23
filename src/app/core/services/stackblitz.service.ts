import { Injectable } from '@angular/core';
import StackBlitzSDK, { Project } from '@stackblitz/sdk';
import type { ChartType } from '@oneteme/jquery-core';
import type { ChartExampleSection } from 'src/app/pages/charts/chart-example-sections';

interface ChartExample {
  config: unknown;
  data: unknown[];
}

@Injectable({ providedIn: 'root' })
export class StackBlitzService {
  openHighchartsExample(section: ChartExampleSection, example: ChartExample): void {
    StackBlitzSDK.openProject(
      this.buildHighchartsProject(section, example),
      {
        newWindow: true,
        openFile: 'src/app/app.component.ts',
        theme: 'light',
        view: 'default',
      },
    );
  }

  private buildHighchartsProject(section: ChartExampleSection, example: ChartExample): Project {
    const dataSource = this.formatValue(example.data, example.data);
    const configSource = this.formatValue(example.config, example.data);

    return {
      title: `jquery-highcharts - ${section.label}`,
      description: `Exemple ${section.label} de @oneteme/jquery-highcharts`,
      template: 'angular-cli',
      dependencies: {
        '@angular/animations': '^16.2.12',
        '@angular/common': '^16.2.12',
        '@angular/compiler': '^16.2.12',
        '@angular/core': '^16.2.12',
        '@angular/platform-browser': '^16.2.12',
        '@angular/platform-browser-dynamic': '^16.2.12',
        '@angular-devkit/build-angular': '^16.2.16',
        '@angular/cli': '^16.2.16',
        '@angular/compiler-cli': '^16.2.12',
        '@oneteme/jquery-core': '^0.0.36',
        '@oneteme/jquery-highcharts': '^0.0.13',
        highcharts: '^11.4.3',
        rxjs: '~7.8.0',
        tslib: '^2.3.0',
        typescript: '~5.1.6',
        'zone.js': '~0.13.0',
      },
      files: {
        'src/index.html': this.buildIndexHtml(section.label),
        'src/main.ts': this.buildMainSource(),
        'src/styles.scss': this.buildGlobalStyles(),
        'src/app/app.component.ts': this.buildComponentSource(section.type, dataSource, configSource),
        'src/app/app.component.html': this.buildComponentTemplate(section.label),
        'src/app/app.component.scss': this.buildComponentStyles(),
      },
      settings: {
        compile: {
          trigger: 'auto',
          action: 'hmr',
          clearConsole: false,
        },
      },
    };
  }

  private buildComponentSource(type: ChartType, dataSource: string, configSource: string): string {
    return `import { Component } from '@angular/core';
import { ChartComponent } from '@oneteme/jquery-highcharts';
import { field } from '@oneteme/jquery-core';
import type { ChartProvider, ChartType } from '@oneteme/jquery-core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ChartComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  chartType: ChartType = ${JSON.stringify(type)};

  data = ${dataSource};

  config: ChartProvider<string, number> = ${configSource};
}
`;
  }

  private buildComponentTemplate(label: string): string {
    return `<main class="example-page">
  <header class="example-header">
    <p class="eyebrow">jquery-highcharts / StackBlitz</p>
    <h1>${this.escapeHtml(label)}</h1>
    <p>Modifiez le type, les données ou la configuration : le graphique se met à jour automatiquement.</p>
  </header>

  <section class="chart-panel" aria-label="Prévisualisation du graphique">
    <chart
      [type]="chartType"
      [config]="config"
      [data]="data"
    ></chart>
  </section>
</main>
`;
  }

  private buildIndexHtml(label: string): string {
    return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>${this.escapeHtml(label)} - jquery-highcharts</title>
  <base href="/">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
  <app-root></app-root>
</body>
</html>
`;
  }

  private buildMainSource(): string {
    return `import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent).catch(error => console.error(error));
`;
  }

  private buildGlobalStyles(): string {
    return `:root {
  font-family: Arial, sans-serif;
  color: #17343a;
  background: #f5f7f6;
}

* { box-sizing: border-box; }
body { margin: 0; }
`;
  }

  private buildComponentStyles(): string {
    return `.example-page {
  min-height: 100vh;
  padding: 2rem;
}

.example-header,
.chart-panel {
  width: min(100%, 1100px);
  margin: 0 auto;
}

.example-header { margin-bottom: 1.5rem; }
.eyebrow { color: #176b72; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
h1 { margin: 0 0 0.75rem; }
.example-header p:last-child { color: #526b73; }
.chart-panel { min-height: 480px; padding: 1.5rem; background: #fff; border: 1px solid #c7d9d8; border-radius: 8px; }
`;
  }

  private formatValue(value: unknown, data: unknown[], indent = 0): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return JSON.stringify(value);
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (typeof value === 'function') return this.formatProvider(value, data);

    if (Array.isArray(value)) {
      if (!value.length) return '[]';
      const padding = ' '.repeat(indent);
      const childPadding = ' '.repeat(indent + 2);
      return `[
${value.map(item => `${childPadding}${this.formatValue(item, data, indent + 2)}`).join(',\n')}
${padding}]`;
    }

    const entries = Object.entries(value as Record<string, unknown>);
    if (!entries.length) return '{}';
    const padding = ' '.repeat(indent);
    const childPadding = ' '.repeat(indent + 2);
    return `{
${entries.map(([key, item]) => `${childPadding}${this.formatPropertyKey(key)}: ${this.formatValue(item, data, indent + 2)}`).join(',\n')}
${padding}}`;
  }

  private formatProvider(provider: Function, data: unknown[]): string {
    if (data.length && data[0] && typeof data[0] === 'object') {
      const row = new Proxy({}, {
        get: (_target, property) => typeof property === 'string' ? property : undefined,
      });
      const fieldName = provider(row, 0);
      if (typeof fieldName === 'string' && fieldName in data[0]) {
        return `field(${JSON.stringify(fieldName)})`;
      }
    }
    return provider.toString();
  }

  private formatPropertyKey(key: string): string {
    return /^[A-Za-z_$][\w$]*$/.test(key) ? key : JSON.stringify(key);
  }

  private escapeHtml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }
}