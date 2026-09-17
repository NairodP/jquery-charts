import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ChartComponent as ApexChartComponent } from '@oneteme/jquery-apexcharts';
import { ChartProvider, ChartType, field, rangeFields } from '@oneteme/jquery-core';

type ApiSource = 'Wrapper' | 'Core' | 'ApexCharts natif';

interface ApiEntry {
  name: string;
  type: string;
  source: ApiSource;
  description: string;
  code: string;
  types?: string;
}

interface ApiSection {
  id: string;
  title: string;
  description: string;
  example: string;
  entries: ApiEntry[];
}

interface FamilyDemo {
  id: string;
  label: string;
  types: ChartType[];
  currentType: ChartType;
  config: ChartProvider<any, any>;
  data: any[];
}

@Component({
  selector: 'app-apexcharts-api',
  standalone: true,
  imports: [CommonModule, RouterLink, ApexChartComponent],
  templateUrl: './apexcharts-api.component.html',
  styleUrls: ['./apexcharts-api.component.scss'],
})
export class ApexChartsApiComponent {
  readonly sections: ApiSection[] = [
    {
      id: 'component',
      title: 'Composant <chart>',
      description: 'Le composant Angular public qui construit un graphique ApexCharts à partir du modèle ChartProvider.',
      example: `<chart
  type="line"
  [config]="config"
  [data]="rows"
  [isLoading]="loading"
  [debug]="debug"
  [view]="organizerView">
</chart>`,
      entries: [
        { name: 'type', type: 'ChartType', source: 'Wrapper', description: 'Sélectionne le renderer interne et traduit les types communs vers les types ApexCharts correspondants.', code: '<chart type="line" ...></chart>', types: 'line, area, bar, column, funnel, pyramid, pie, donut, polar, radar, radial, heatmap, treemap, rangeArea, rangeBar, rangeColumn' },
        { name: 'config', type: 'ChartProvider<X, Y>', source: 'Core', description: 'Décrit les séries, les coordonnées et les options communes. Le wrapper relit notamment title, subtitle, axes, dimensions, pivot, stacked et showToolbar.', code: '<chart [config]="config" ...></chart>', types: 'Tous' },
        { name: 'data', type: 'any[]', source: 'Wrapper', description: 'Lignes brutes utilisées par jquery-core pour construire les séries ApexCharts.', code: '<chart [data]="rows" ...></chart>', types: 'Tous' },
        { name: 'isLoading', type: 'boolean', source: 'Wrapper', description: 'Change le texte de l’état no-data en « Chargement des données... ». Avec un tableau vide, ApexCharts affiche cet état.', code: '<chart [isLoading]="loading" ...></chart>', types: 'Tous' },
        { name: 'debug', type: 'boolean', source: 'Wrapper', description: 'Active les logs de cycle de vie et d’hydratation dans la console du navigateur.', code: '<chart [debug]="true" ...></chart>', types: 'Tous' },
        { name: 'view', type: 'OrganizerConfig', source: 'Wrapper', description: 'Passe une configuration de visibilité au ChartViewFacade interne. Le composant ApexCharts ne fournit pas de bouton Organizer ni d’output d’état : il faut donc traiter cette entrée comme une intégration avancée.', code: '<chart [view]="{ enabled: true }" ...></chart>', types: 'Séries nommées' },
      ],
    },
    {
      id: 'provider',
      title: 'ChartProvider consommé par ApexCharts',
      description: 'Les champs du modèle partagé qui ont un effet concret dans les directives ApexCharts.',
      example: `const config: ChartProvider<string, number> = {
  title: 'Temps de réponse',
  subtitle: 'P50 et P95',
  height: 320,
  showToolbar: true,
  continue: false,
  series: [
    { name: 'P50', data: { x: field('week'), y: field('p50') } },
    { name: 'P95', data: { x: field('week'), y: field('p95') } },
  ],
  options: { stroke: { curve: 'smooth' } },
};`,
      entries: [
        { name: 'series', type: 'SerieProvider<X, Y>[]', source: 'Core', description: 'Construit les séries et leurs coordonnées avec field(), des fonctions x/y ou la forme sérialisable { xField, yField }. name, color, stack, visible, unit et yAxisIndex sont conservés lors de la construction.', code: "series: [{ name: 'P50', data: { x: field('week'), y: field('p50') } }]" },
        { name: 'title / subtitle', type: 'string', source: 'Wrapper', description: 'Sont convertis vers les options title et subtitle natives d’ApexCharts.', code: "{ title: 'Ventes', subtitle: 'Mensuel' }" },
        { name: 'xtitle / ytitle', type: 'string | string[]', source: 'Wrapper', description: 'Alimente les titres des axes xaxis et yaxis. ytitle peut décrire plusieurs axes.', code: "{ xtitle: 'Mois', ytitle: 'k€' }" },
        { name: 'width / height', type: 'number', source: 'Wrapper', description: 'Définit les dimensions transmises aux options chart d’ApexCharts.', code: '{ width: 720, height: 320 }' },
        { name: 'stacked', type: 'boolean', source: 'Wrapper', description: 'Active le mode empilé dans les graphiques à barres et colonnes.', code: '{ stacked: true }' },
        { name: 'pivot / continue / xorder', type: 'boolean / boolean / Sort', source: 'Core', description: 'Contrôle la construction commune des données : pivot des séries, coordonnées continues [x, y] et ordre des catégories.', code: "{ pivot: false, continue: false, xorder: 'asc' }" },
        { name: 'showToolbar', type: 'boolean', source: 'Wrapper', description: 'Affiche la toolbar ApexCharts et ses commandes custom précédent, suivant et pivot ajoutées par le wrapper.', code: '{ showToolbar: true }' },
        { name: 'options', type: 'ApexCharts options', source: 'ApexCharts natif', description: 'Surcharge les options natives après les options communes. C’est le point d’extension pour stroke, colors, tooltip, plotOptions, annotations, zoom, dataLabels, etc.', code: "options: { stroke: { curve: 'smooth' }, colors: ['#176b72'] }" },
      ],
    },
    {
      id: 'types',
      title: 'Types et transformations',
      description: 'Les cinq directives internes regroupent les types en familles et adaptent les données au format attendu par ApexCharts.',
      example: `<chart type="rangeBar" [config]="rangeConfig" [data]="rangeRows"></chart>

// Le même composant peut recevoir un autre type de la famille.
<chart type="rangeColumn" [config]="rangeConfig" [data]="rangeRows"></chart>`,
      entries: [
        { name: 'line-chart', type: '[line-chart]', source: 'Wrapper', description: 'Gère line et area, les séries multi-indicateurs et les coordonnées catégorielles, numériques ou temporelles.', code: '<chart type="line" ...></chart>', types: 'line, area' },
        { name: 'bar-chart', type: '[bar-chart]', source: 'Wrapper', description: 'Gère bar, column, funnel et pyramid. funnel et pyramid trient les lignes selon la mesure principale et désactivent le pivot.', code: '<chart type="funnel" ...></chart>', types: 'bar, column, funnel, pyramid' },
        { name: 'pie-chart', type: '[pie-chart]', source: 'Wrapper', description: 'Transforme une série commune en valeurs et labels ApexCharts pour les vues circulaires. radar accepte plusieurs séries.', code: '<chart type="donut" ...></chart>', types: 'pie, donut, polar, radial, radar' },
        { name: 'treemap-chart', type: '[treemap-chart]', source: 'Wrapper', description: 'Construit les séries nécessaires aux vues de matrice et de hiérarchie.', code: '<chart type="heatmap" ...></chart>', types: 'heatmap, treemap' },
        { name: 'range-chart', type: '[range-chart]', source: 'Wrapper', description: 'Consomme une valeur Y sous forme de paire [min, max] et la rend comme zone ou barres d’intervalle.', code: '<chart type="rangeArea" ...></chart>', types: 'rangeArea, rangeBar, rangeColumn' },
      ],
    },
    {
      id: 'limits',
      title: 'Contrat public et limites',
      description: 'ApexCharts ne reprend pas automatiquement toutes les extensions documentées par les autres renderers du workspace.',
      example: `// Les options natives passent par config.options.
const config = {
  series: [...],
  options: {
    tooltip: { shared: true },
    dataLabels: { enabled: false },
  },
};

// Le composant ApexCharts n’expose pas de renderedOption,
// chartClick, exportImage(), drilldown ou groupSync.`,
      entries: [
        { name: 'group / groupSync', type: 'ChartProvider fields', source: 'Core', description: 'Présents dans le modèle commun, mais non consommés par les directives ApexCharts actuelles. Ne pas les présenter comme une synchronisation fonctionnelle pour ce renderer.', code: '// Pas de groupSync effectif dans jquery-apexcharts' },
        { name: 'renderedOption', type: 'non exposé', source: 'Wrapper', description: 'Contrairement à ECharts et Highcharts, le composant ApexCharts n’a pas d’input d’option rendue complète séparé de config.options.', code: '// Utiliser config.options à la place' },
        { name: 'événements de point', type: 'non exposés par <chart>', source: 'ApexCharts natif', description: 'Les directives possèdent un événement interne customEvent pour la toolbar, mais ChartComponent ne le ré-exporte pas comme output Angular public.', code: '// Aucun (chartClick) public sur le composant ApexCharts' },
        { name: 'exports / snapshots / fullscreen', type: 'non exposés', source: 'Wrapper', description: 'Aucune méthode publique équivalente à exportImage, exportData, copyVisualSnapshot ou toggleFullscreen n’est fournie par ce package.', code: '// Ces capacités ne font pas partie du contrat ApexCharts actuel' },
      ],
    },
  ];

  readonly familyDemos: FamilyDemo[] = [
    {
      id: 'line',
      label: 'Ligne et zone',
      types: ['line', 'area'],
      currentType: 'line',
      config: {
        title: 'Temps de réponse API',
        subtitle: 'Deux séries construites par jquery-core',
        series: [
          { name: 'P50', data: { x: field('week'), y: field('p50') } },
          { name: 'P95', data: { x: field('week'), y: field('p95') } },
        ],
      },
      data: [
        { week: 'S1', p50: 120, p95: 340 },
        { week: 'S2', p50: 132, p95: 410 },
        { week: 'S3', p50: 101, p95: 280 },
        { week: 'S4', p50: 134, p95: 390 },
        { week: 'S5', p50: 90, p95: 260 },
      ],
    },
    {
      id: 'bar',
      label: 'Barres, colonnes et funnel',
      types: ['bar', 'column', 'funnel', 'pyramid'],
      currentType: 'column',
      config: {
        title: 'Tickets par priorité',
        series: [{ name: 'Tickets', data: { x: field('level'), y: field('count') } }],
      },
      data: [
        { level: 'P1', count: 42 },
        { level: 'P2', count: 68 },
        { level: 'P3', count: 96 },
        { level: 'P4', count: 124 },
      ],
    },
    {
      id: 'radial',
      label: 'Circulaires et radar',
      types: ['pie', 'donut', 'polar', 'radial', 'radar'],
      currentType: 'donut',
      config: {
        title: 'Répartition des clients',
        series: [{ name: 'Clients', data: { x: field('segment'), y: field('value') } }],
      },
      data: [
        { segment: 'Enterprise', value: 42 },
        { segment: 'Mid-Market', value: 28 },
        { segment: 'SMB', value: 18 },
        { segment: 'Public', value: 12 },
      ],
    },
    {
      id: 'matrix',
      label: 'Heatmap et treemap',
      types: ['heatmap', 'treemap'],
      currentType: 'heatmap',
      config: {
        title: 'Trafic par créneau',
        series: [{ name: field('day'), data: { x: field('hour'), y: field('value') } }],
      },
      data: [
        { hour: '00h', day: 'Lun', value: 12 },
        { hour: '08h', day: 'Lun', value: 42 },
        { hour: '16h', day: 'Lun', value: 35 },
        { hour: '00h', day: 'Mar', value: 10 },
        { hour: '08h', day: 'Mar', value: 45 },
        { hour: '16h', day: 'Mar', value: 38 },
      ],
    },
    {
      id: 'range',
      label: 'Plages min / max',
      types: ['rangeArea', 'rangeBar', 'rangeColumn'],
      currentType: 'rangeArea',
      config: {
        title: 'Températures mensuelles',
        series: [{ name: 'Température', data: { x: field('month'), y: rangeFields('min', 'max') } }],
      },
      data: [
        { month: 'Jan', min: 2, max: 9 },
        { month: 'Fév', min: 3, max: 11 },
        { month: 'Mar', min: 6, max: 15 },
        { month: 'Avr', min: 9, max: 19 },
        { month: 'Mai', min: 13, max: 23 },
      ],
    },
  ];

  readonly toolbarConfig: ChartProvider<string, number> = {
    title: 'Toolbar du wrapper',
    subtitle: 'Les boutons custom sont gérés en interne par ChartComponent',
    showToolbar: true,
    series: [{ name: 'Déploiements', data: { x: field('day'), y: field('count') } }],
  };

  readonly toolbarData = [
    { day: 'Lun', count: 12 },
    { day: 'Mar', count: 18 },
    { day: 'Mer', count: 15 },
    { day: 'Jeu', count: 24 },
    { day: 'Ven', count: 21 },
  ];

  readonly nativeOptionsConfig: ChartProvider<string, number> = {
    title: 'Options ApexCharts natives',
    xtitle: 'Semaine',
    ytitle: 'Déploiements',
    series: [{ name: 'Déploiements', data: { x: field('week'), y: field('count') } }],
    options: {
      colors: ['#bc5b35'],
      stroke: { curve: 'smooth', width: 3 },
      markers: { size: 4 },
      dataLabels: { enabled: false },
      tooltip: { shared: true },
      chart: { animations: { enabled: true }, zoom: { enabled: true } },
    },
  };

  readonly nativeOptionsData = [
    { week: 'S1', count: 14 },
    { week: 'S2', count: 22 },
    { week: 'S3', count: 19 },
    { week: 'S4', count: 31 },
    { week: 'S5', count: 27 },
    { week: 'S6', count: 38 },
  ];

  isLoadingDemo = false;
  isEmptyDemo = false;
  stateData = this.toolbarData;

  setFamilyType(demo: FamilyDemo, type: ChartType): void {
    demo.currentType = type;
  }

  setState(state: 'ready' | 'loading' | 'empty'): void {
    this.isLoadingDemo = state === 'loading';
    this.isEmptyDemo = state === 'empty';
    this.stateData = state === 'ready' ? this.toolbarData : [];
  }
}