import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

export type ApiSource = 'Wrapper' | 'Core' | 'ECharts natif';

export interface ApiEntry {
  name: string;
  type: string;
  source: ApiSource;
  description: string;
  code: string;
  types?: string;
}

export interface ApiSection {
  id: string;
  title: string;
  description: string;
  entries: ApiEntry[];
}

@Component({
  selector: 'app-echarts-api',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './echarts-api.component.html',
  styleUrls: ['./echarts-api.component.scss'],
})
export class EChartsApiComponent {
  readonly sections: ApiSection[] = [
    {
      id: 'component',
      title: 'Composant <chart>',
      description: 'Le composant Angular qui encapsule le rendu ECharts et les comportements ajoutés par jquery-echarts.',
      entries: [
        { name: 'type', type: 'ChartType', source: 'Wrapper', description: 'Choisit le type de graphique à afficher.', code: '<chart type="line" ...></chart>', types: 'Tous' },
        { name: 'config', type: 'ChartProvider<X, Y>', source: 'Wrapper', description: 'Passe la configuration de votre graphique au composant.', code: '<chart [config]="config" ...></chart>', types: 'Tous' },
        { name: 'data', type: 'any[]', source: 'Wrapper', description: 'Passe les lignes utilisées par les providers de données.', code: '<chart [data]="rows" ...></chart>', types: 'Tous' },
        { name: 'isLoading', type: 'boolean', source: 'Wrapper', description: 'Affiche le chargement natif pendant votre requête.', code: '<chart [isLoading]="loading" ...></chart>', types: 'Tous' },
        { name: 'loadingLabel / noDataLabel', type: 'string', source: 'Wrapper', description: 'Change les textes affichés pendant le chargement ou quand il n’y a aucune donnée.', code: '<chart loadingLabel="Chargement..." noDataLabel="Aucun résultat" ...></chart>', types: 'Tous' },
        { name: 'theme / renderer', type: 'string / \'svg\' | \'canvas\'', source: 'Wrapper', description: 'theme accepte un nom de thème ECharts enregistré ; light est le thème intégré le plus simple. renderer choisit le moteur de rendu SVG ou Canvas.', code: '<chart theme="light" renderer="svg" ...></chart>', types: 'Tous' },
        { name: 'group', type: 'string | null', source: 'Wrapper', description: 'Sert à relier plusieurs graphiques qui affichent des informations liées. Par exemple, un graphique des ventes et un graphique de la marge peuvent suivre la même période : sans le même group, chacun réagit seul ; avec group="sales-dashboard", ils peuvent être synchronisés.', code: '<chart group="sales-dashboard" ...></chart>\n<chart group="sales-dashboard" ...></chart>', types: 'Tous' },
        { name: 'groupSync', type: 'GroupSyncMode', source: 'Wrapper', description: 'Indique quelles interactions doivent être transmises entre les graphiques portant le même group. Utilisez "tooltip" pour déplacer le survol ensemble, "datazoom" pour conserver la même période zoomée, ou "all" pour les deux (valeur par défaut). groupSync ne relie pas les graphiques : il règle seulement ce qui circule entre eux.', code: '<chart group="sales-dashboard" groupSync="tooltip" ...></chart>\n<chart group="sales-dashboard" groupSync="tooltip" ...></chart>', types: 'Tous' },
        { name: 'organizer', type: 'OrganizerConfig', source: 'Wrapper', description: 'Active la gestion interne de la visibilité des séries nommées avec enabled: true. Le composant <chart> ne rend pas lui-même un bouton ou un panneau : l’interface Organizer doit être intégrée séparément.', code: '<chart [organizer]="{ enabled: true }" ...></chart>', types: 'Tous' },
        { name: 'drilldown', type: 'ChartDrilldownConfig', source: 'Wrapper', description: 'Ajoute un breadcrumb et une navigation entre plusieurs niveaux de données. L’application reste responsable de charger les données et de mettre à jour activeLevel.', code: '<chart [drilldown]="drilldown" (drilldownNavigate)="onNavigate($event)" ...></chart>', types: 'Tous' },
        { name: 'copyFeedback', type: 'VisualCopyFeedbackConfig', source: 'Wrapper', description: 'Configure le message affiché après une copie visuelle.', code: '<chart [copyFeedback]="{ enabled: true }" ...></chart>', types: 'Tous' },
      ],
    },
    {
      id: 'events-methods',
      title: 'Événements et méthodes',
      description: 'Les points d’intégration utilisés par l’application consommatrice.',
      entries: [
        { name: 'chartClick', type: 'EventEmitter<ChartClickEvent>', source: 'Wrapper', description: 'Récupère le point cliqué, son index, son nom, sa valeur et sa ligne.', code: '<chart (chartClick)="onChartClick($event)" ...></chart>' },
        { name: 'drilldownNavigate', type: 'EventEmitter<string>', source: 'Wrapper', description: 'Récupère le niveau demandé quand l’utilisateur clique sur le breadcrumb.', code: '<chart (drilldownNavigate)="onNavigate($event)" ...></chart>' },
        { name: 'drilldownStateChange', type: 'EventEmitter<ChartDrilldownState>', source: 'Wrapper', description: 'Informe l’application du niveau actuellement confirmé. active vaut true lorsque le graphique est à un niveau inférieur au premier niveau.', code: '<chart (drilldownStateChange)="onDrilldownState($event)" ...></chart>' },
        { name: 'drilldown-active', type: 'classe CSS hôte', source: 'Wrapper', description: 'Classe ajoutée au composant <chart> lorsque activeLevel est différent du premier niveau. La librairie ne lui applique aucun style : votre dashboard peut afficher une bordure, un badge ou un autre signal.', code: 'chart.drilldown-active { border: 2px solid #d97732; }' },
        { name: 'exportImage()', type: '(fileName, type, pixelRatio) => void', source: 'Wrapper', description: 'Exporte le graphique en PNG, JPEG ou SVG depuis une référence au composant.', code: 'this.chart.exportImage(\'sales.png\', \'png\');' },
        { name: 'exportData()', type: '(fileName, separator) => void', source: 'Wrapper', description: 'Exporte les données affichées en CSV.', code: 'this.chart.exportData(\'sales.csv\', \';\');' },
        { name: 'createVisualSnapshot()', type: '() => VisualSnapshotDraft', source: 'Wrapper', description: 'Prépare une copie des données et de l’état du graphique.', code: 'const draft = this.chart.createVisualSnapshot(\'Ventes\');' },
        { name: 'copyVisualSnapshot()', type: '(label?) => VisualSnapshot | null', source: 'Wrapper', description: 'Crée et enregistre un snapshot visuel nommé.', code: 'this.chart.copyVisualSnapshot(\'Ventes filtrées\');' },
      ],
    },
    {
      id: 'provider',
      title: 'ChartProvider',
      description: 'Configuration commune fournie par jquery-core. Les propriétés natives ECharts restent accessibles via les objets transmis au wrapper.',
      entries: [
        { name: 'title / xtitle / ytitle', type: 'string', source: 'Core', description: 'Ajoute le titre du graphique et les titres de ses axes.', code: 'const config = { title: \'Ventes mensuelles\', xtitle: \'Mois\', ytitle: \'Montant\' };' },
        { name: 'series', type: 'ChartSerie[]', source: 'Core', description: 'Décrit les séries et relie leurs axes aux propriétés de vos lignes.', code: 'series: [{ name: \'Ventes\', data: { x: field(\'month\'), y: field(\'sales\') } }]' },
        { name: 'pivot', type: 'boolean', source: 'Core', description: 'Construit les séries à partir des catégories et des providers.', code: 'pivot: true,' },
        { name: 'continue', type: 'boolean', source: 'Core', description: 'Conserve chaque point dans l’ordre des données reçues.', code: 'continue: true,' },
        { name: 'xorder', type: 'string | comparator', source: 'Core', description: 'Contrôle l’ordre des catégories affichées.', code: 'xorder: \'month\',' },
        { name: 'height', type: 'number', source: 'Core', description: 'Définit la hauteur du composant en pixels.', code: 'height: 360,' },
      ],
    },
    {
      id: 'providers',
      title: 'Providers de données',
      description: 'Fonctions utilitaires de jquery-core pour relier les lignes aux axes et aux séries.',
      entries: [
        { name: 'field(name)', type: 'DataProvider<T>', source: 'Core', description: 'Lit une propriété de la ligne courante pour un axe ou une série.', code: 'data: { x: field(\'month\'), y: field(\'sales\') }' },
        { name: 'values(...items)', type: 'DataProvider<T>', source: 'Core', description: 'Fournit une valeur fixe pour chaque ligne.', code: 'data: { x: field(\'month\'), y: values(10, 20, 30) }' },
        { name: 'rangeFields(min, max)', type: 'DataProvider<T[]>', source: 'Core', description: 'Construit une plage à partir de deux propriétés.', code: 'data: { x: field(\'month\'), y: rangeFields(\'min\', \'max\') }' },
        { name: 'joinFields(separator, ...names)', type: 'DataProvider<string>', source: 'Core', description: 'Assemble plusieurs propriétés en une seule valeur.', code: 'x: joinFields(\' / \', \'region\', \'team\'),' },
        { name: 'combineFields / combineProviders', type: 'DataProvider<T>', source: 'Core', description: 'Combine plusieurs champs ou providers avec votre propre fonction.', code: 'x: combineFields(values => values.join(\' - \'), [\'region\', \'team\']),' },
      ],
    },
    {
      id: 'pivot',
      title: 'pivotRows()',
      description: 'Transforme des données longues en lignes larges avant le rendu. Cette fonction appartient à jquery-core et n’est pas limitée à ECharts.',
      entries: [
        { name: 'index / columns / values', type: 'PivotRowsOptions<T>', source: 'Core', description: 'Choisit la colonne des lignes, la colonne à transformer en en-têtes et la mesure à agréger.', code: "const data = pivotRows(rows, { index: 'usage_type', columns: 'category', values: ['consumption'] });" },
        { name: 'aggregate', type: '\'sum\' | \'count\' | \'min\' | \'max\' | function', source: 'Core', description: 'Choisit la façon de calculer chaque cellule du pivot.', code: "aggregate: 'count', // ou 'sum', 'min', 'max'" },
        { name: 'fill', type: 'string | number | boolean | null | function', source: 'Core', description: 'Définit la valeur affichée quand une combinaison n’existe pas.', code: 'fill: 0,' },
        { name: 'indexValues / columnValues', type: 'readonly ReshapeKey[]', source: 'Core', description: 'Force les lignes ou colonnes attendues, même si elles sont absentes des données.', code: "columnValues: ['beneficiaire', 'titulaire', 'absent']," },
        { name: 'normalizeKey', type: '(value) => string | number', source: 'Core', description: 'Uniformise les clés avant le regroupement.', code: 'normalizeKey: value => String(value).toLowerCase(),' },
        { name: 'missingKey', type: '\'empty\' | \'skip\' | \'error\'', source: 'Core', description: 'Choisit quoi faire lorsqu’une clé est absente.', code: "missingKey: 'skip', // ou 'empty' / 'error'" },
        { name: 'separator / indexName / columnName', type: 'string / string / function', source: 'Core', description: 'Personnalise les noms des colonnes produites.', code: "separator: '.', indexName: 'usage'," },
      ],
    },
  ];
}
