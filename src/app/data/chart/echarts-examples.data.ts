import { field, pivotRows, rangeFields, XaxisType, YaxisType } from '@oneteme/jquery-core';
import { ChartData, ChartDataCollection } from '../../core/models/chart.model';

export type EChartsExampleData = ChartData<XaxisType, YaxisType>;

const PIVOT_ROWS_SOURCE = [
  { usage_type: 'Eclairage Public', authorization_type: 'beneficiaire', consumption: 120 },
  { usage_type: 'Eclairage Public', authorization_type: 'beneficiaire', consumption: 30 },
  { usage_type: 'Eclairage Public', authorization_type: 'titulaire', consumption: 80 },
  { usage_type: 'Industrie', authorization_type: 'beneficiaire', consumption: 240 },
  { usage_type: 'Industrie', authorization_type: 'titulaire', consumption: 160 },
];

const PIVOT_ROWS_RESULT = pivotRows(PIVOT_ROWS_SOURCE, {
  index: 'usage_type',
  columns: 'authorization_type',
  values: ['consumption'],
  columnValues: ['beneficiaire', 'titulaire', 'absent'],
  aggregate: 'sum',
  fill: 0,
});

console.groupCollapsed('[jquery-echarts] Exemple pivotRows');
console.log('Donnees source:', PIVOT_ROWS_SOURCE);
console.log('Resultat pivote:', PIVOT_ROWS_RESULT);
console.log('Doublon agrege: beneficiaire/Eclairage Public = 150');
console.log('Combinaison absente remplie: absent = 0');
console.groupEnd();

export const ECHARTS_EXAMPLES: ChartDataCollection<EChartsExampleData> = {

  barExample: {
    data: [
      { palier: 'P1 Critique', count: 42 },
      { palier: 'P2 Élevé', count: 68 },
      { palier: 'P3 Moyen', count: 96 },
      { palier: 'P4 Faible', count: 124 },
    ],
    config: {
      title: 'Tickets par priorité (par mois',
      series: [{ data: { x: field('palier'), y: field('count') }, name: 'Tickets' }],
    },
  },

  columnExample: {
    data: [
      { mois: 'Jan', prod: 410, stg: 280, dev: 190 },
      { mois: 'Fév', prod: 390, stg: 310, dev: 210 },
      { mois: 'Mar', prod: 450, stg: 260, dev: 230 },
      { mois: 'Avr', prod: 480, stg: 290, dev: 200 },
      { mois: 'Mai', prod: 420, stg: 300, dev: 220 },
    ],
    config: {
      title: 'Incidents par environnement',
      series: [
        { data: { x: field('mois'), y: field('prod') }, name: 'Production' },
        { data: { x: field('mois'), y: field('stg') },  name: 'Staging' },
        { data: { x: field('mois'), y: field('dev') },  name: 'Dev' },
      ],
    },
  },

  lineExample: {
    data: [
      { semaine: 'S1', p50: 120, p95: 340 },
      { semaine: 'S2', p50: 132, p95: 410 },
      { semaine: 'S3', p50: 101, p95: 280 },
      { semaine: 'S4', p50: 134, p95: 390 },
      { semaine: 'S5', p50: 90,  p95: 260 },
      { semaine: 'S6', p50: 150, p95: 450 },
    ],
    config: {
      title: 'Temps de réponse API',
      series: [
        { data: { x: field('semaine'), y: field('p50') }, name: 'P50' },
        { data: { x: field('semaine'), y: field('p95') }, name: 'P95' },
      ],
    },
  },

  splineExample: {
    data: [
      { mois: 'Jan', backend: 245, frontend: 180, mobile: 95  },
      { mois: 'Fév', backend: 188, frontend: 210, mobile: 130 },
      { mois: 'Mar', backend: 320, frontend: 165, mobile: 210 },
      { mois: 'Avr', backend: 270, frontend: 290, mobile: 175 },
      { mois: 'Mai', backend: 410, frontend: 240, mobile: 310 },
      { mois: 'Jun', backend: 360, frontend: 380, mobile: 260 },
      { mois: 'Jul', backend: 195, frontend: 320, mobile: 420 },
      { mois: 'Aoû', backend: 280, frontend: 195, mobile: 340 },
      { mois: 'Sep', backend: 450, frontend: 430, mobile: 290 },
      { mois: 'Oct', backend: 390, frontend: 360, mobile: 480 },
      { mois: 'Nov', backend: 520, frontend: 410, mobile: 390 },
      { mois: 'Déc', backend: 460, frontend: 490, mobile: 530 },
    ],
    config: {
      title: 'Incidents par équipe',
      series: [
        { data: { x: field('mois'), y: field('backend')  }, name: 'Backend'  },
        { data: { x: field('mois'), y: field('frontend') }, name: 'Frontend' },
        { data: { x: field('mois'), y: field('mobile')   }, name: 'Mobile'   },
      ],
    },
  },

  areaExample: {
    data: [
      { heure: '00h', req: 120 },
      { heure: '04h', req: 60  },
      { heure: '08h', req: 340 },
      { heure: '12h', req: 520 },
      { heure: '16h', req: 480 },
      { heure: '20h', req: 280 },
    ],
    config: {
      title: 'Volume de requêtes par heure',
      subtitle: 'Zone remplie',
      series: [{ data: { x: field('heure'), y: field('req') }, name: 'Requêtes' }],
    },
  },

  pieExample: {
    data: [
      { segment: 'Enterprise', value: 42 },
      { segment: 'Mid-Market', value: 28 },
      { segment: 'SMB', value: 18 },
      { segment: 'Public', value: 12 },
    ],
    config: {
      title: 'Répartition des clients',
      series: [{ data: { x: field('segment'), y: field('value') }, name: 'Clients' }],
    },
  },

  donutExample: {
    data: [
      { status: '2xx', count: 840 },
      { status: '3xx', count: 120 },
      { status: '4xx', count: 65  },
      { status: '5xx', count: 15  },
    ],
    config: {
      title: 'Codes de réponse HTTP',
      subtitle: 'Dernières 24h',
      series: [{ data: { x: field('status'), y: field('count') }, name: 'Requêtes' }],
    },
  },

  scatterExample: {
    data: [
      { spend: 12, leads: 420, seg: 'Retail' },
      { spend: 18, leads: 510, seg: 'Retail' },
      { spend: 30, leads: 720, seg: 'Enterprise' },
      { spend: 38, leads: 860, seg: 'Enterprise' },
      { spend: 6,  leads: 210, seg: 'SMB' },
      { spend: 9,  leads: 280, seg: 'SMB' },
    ],
    config: {
      title: 'Marketing : budget vs leads',
      xtitle: 'Dépenses (k€)',
      ytitle: 'Leads',
      continue: true,
      series: [{ data: { x: field('spend'), y: field('leads') }, name: field('seg') }],
    },
  },

  bubbleExample: {
    data: [
      { x: 10, y: 220, z: 30, name: 'Appli A' },
      { x: 25, y: 340, z: 60, name: 'Appli B' },
      { x: 40, y: 180, z: 20, name: 'Appli C' },
      { x: 15, y: 400, z: 80, name: 'Appli D' },
      { x: 55, y: 290, z: 45, name: 'Appli E' },
    ],
    config: {
      title: 'Applications : perf vs coût (taille = usage)',
      xtitle: 'Coût (k€/mois)',
      ytitle: 'Req/s',
      continue: true,
      series: [{ data: { x: field('x'), y: field('y') }, name: field('name') }],
    },
  },

  heatmapExample: {
    data: [
      { heure: '00h', jour: 'Lun', val: 12 },
      { heure: '08h', jour: 'Lun', val: 42 },
      { heure: '16h', jour: 'Lun', val: 35 },
      { heure: '00h', jour: 'Mar', val: 10 },
      { heure: '08h', jour: 'Mar', val: 45 },
      { heure: '16h', jour: 'Mar', val: 38 },
      { heure: '00h', jour: 'Mer', val: 8  },
      { heure: '08h', jour: 'Mer', val: 50 },
      { heure: '16h', jour: 'Mer', val: 40 },
      { heure: '00h', jour: 'Jeu', val: 7  },
      { heure: '08h', jour: 'Jeu', val: 48 },
      { heure: '16h', jour: 'Jeu', val: 39 },
      { heure: '00h', jour: 'Ven', val: 9  },
      { heure: '08h', jour: 'Ven', val: 46 },
      { heure: '16h', jour: 'Ven', val: 36 },
    ],
    config: {
      title: 'Trafic hebdomadaire',
      series: [{ data: { x: field('heure'), y: field('val') }, name: field('jour') }],
    },
  },

  treemapExample: {
    data: [
      { label: 'Auth', count: 320 },
      { label: 'Payment', count: 210 },
      { label: 'Catalog', count: 180 },
      { label: 'Cart', count: 150 },
      { label: 'Search', count: 130 },
      { label: 'Profile', count: 90  },
      { label: 'Notif', count: 60  },
    ],
    config: {
      title: 'Appels par micro-service',
      series: [{ data: { x: field('label'), y: field('count') } }],
    },
  },

  funnelExample: {
    data: [
      { etape: 'Visites', count: 10000 },
      { etape: 'Inscriptions', count: 4200  },
      { etape: 'Activation', count: 2100  },
      { etape: 'Rétention', count: 900   },
      { etape: 'Conversion', count: 320   },
    ],
    config: {
      title: 'Funnel de conversion produit',
      series: [{ data: { x: field('etape'), y: field('count') } }],
    },
  },

  pyramidExample: {
    data: [
      { tranche: '18-24', count: 1200 },
      { tranche: '25-34', count: 2800 },
      { tranche: '35-44', count: 3400 },
      { tranche: '45-54', count: 2600 },
      { tranche: '55+', count: 1800 },
    ],
    config: {
      title: 'Pyramide démographique utilisateurs',
      series: [{ data: { x: field('tranche'), y: field('count') } }],
    },
  },

  radarExample: {
    data: [
      { dim: 'Performance', svc_a: 80, svc_b: 65 },
      { dim: 'Fiabilité', svc_a: 92, svc_b: 88 },
      { dim: 'Sécurité', svc_a: 75, svc_b: 90 },
      { dim: 'Scalabilité', svc_a: 70, svc_b: 60 },
      { dim: 'UX', svc_a: 85, svc_b: 72 },
    ],
    config: {
      title: 'Comparaison services',
      series: [
        { data: { x: field('dim'), y: field('svc_a') }, name: 'Service A' },
        { data: { x: field('dim'), y: field('svc_b') }, name: 'Service B' },
      ],
    },
  },

  rangeBarExample: {
    data: [
      { tache: 'Design', debut: 1, fin: 3 },
      { tache: 'Développement', debut: 2, fin: 7 },
      { tache: 'Tests', debut: 6, fin: 9 },
      { tache: 'Déploiement', debut: 8, fin: 10 },
    ],
    config: {
      title: 'Planning projet (Gantt)',
      subtitle: 'En semaines',
      series: [{ data: { x: field('tache'), y: rangeFields('debut', 'fin') } }],
    },
  },

  rangeColumnExample: {
    data: [
      { mois: 'Jan', min: 96.1, max: 99.2 },
      { mois: 'Fév', min: 96.8, max: 99.4 },
      { mois: 'Mar', min: 95.6, max: 99.0 },
      { mois: 'Avr', min: 97.2, max: 99.6 },
      { mois: 'Mai', min: 97.8, max: 99.7 },
    ],
    config: {
      title: 'SLA : plage de disponibilité (%)',
      series: [{ data: { x: field('mois'), y: rangeFields('min', 'max') }, name: 'Uptime' }],
    },
  },

  multiSeriesExample: {
    data: [
      { date: '19 nov', authorized: 0.21, unauthorized: 0.12, trend: 0.15 },
      { date: '20 nov', authorized: 0.20, unauthorized: 0.13, trend: 0.18 },
      { date: '21 nov', authorized: 0.23, unauthorized: 0.18, trend: 0.22 },
      { date: '22 nov', authorized: 0.28, unauthorized: 0.12, trend: 0.25 },
      { date: '23 nov', authorized: 0.17, unauthorized: 0.10, trend: 0.20 },
    ],
    config: {
      title: 'Production multi-séries',
      xtitle: 'Date',
      ytitle: 'Production (MWh)',
      series: [
        { data: { x: field('date'), y: field('authorized') }, name: 'Autorisé', type: 'column', stack: 'production' },
        { data: { x: field('date'), y: field('unauthorized') }, name: 'Effectif', type: 'column', stack: 'production' },
        { data: { x: field('date'), y: field('trend') }, name: 'Tendance', type: 'line' },
      ],
    },
  },

  dualAxisExample: {
    data: [
      { mois: 'Jan', production: 420, temperature: 8   },
      { mois: 'Fév', production: 390, temperature: 10  },
      { mois: 'Mar', production: 450, temperature: 14  },
      { mois: 'Avr', production: 480, temperature: 18  },
      { mois: 'Mai', production: 520, temperature: 22  },
      { mois: 'Jun', production: 580, temperature: 26  },
      { mois: 'Jul', production: 620, temperature: 28  },
      { mois: 'Aoû', production: 610, temperature: 27  },
      { mois: 'Sep', production: 550, temperature: 24  },
      { mois: 'Oct', production: 480, temperature: 18  },
      { mois: 'Nov', production: 420, temperature: 12  },
      { mois: 'Déc', production: 380, temperature: 6   },
    ],
    config: {
      title: 'Production solaire vs température',
      series: [
        { data: { x: field('mois'), y: field('production') }, name: 'Production', type: 'column', unit: 'MWh', yAxisIndex: 0 },
        { data: { x: field('mois'), y: field('temperature') }, name: 'Température', type: 'line', unit: '°C', yAxisIndex: 1 },
      ],
    },
  },

  customAxisExample: {
    data: [
      { mois: 'Jan', production: 420, temperature: 8 },
      { mois: 'Fév', production: 390, temperature: 10 },
      { mois: 'Mar', production: 450, temperature: 14 },
      { mois: 'Avr', production: 480, temperature: 18 },
      { mois: 'Mai', production: 520, temperature: 22 },
      { mois: 'Jun', production: 580, temperature: 26 },
    ],
    config: {
      title: 'Axes Y personnalisés',
      ytitle: ['Production (MWh)', 'Température (°C)'],
      series: [
        {
          data: { x: field('mois'), y: field('production') },
          name: 'Production',
          type: 'column',
          unit: 'MWh',
          yAxisIndex: 0,
          yAxisConfig: {
            min: 0,
            splitNumber: 4,
            axisLine: { lineStyle: { color: '#4f6fd8' } },
            axisLabel: { formatter: (value: number) => `${value} MWh` },
          },
        },
        {
          data: { x: field('mois'), y: field('temperature') },
          name: 'Température',
          type: 'line',
          unit: '°C',
          yAxisIndex: 1,
          yAxisConfig: {
            min: 0,
            max: 40,
            splitNumber: 4,
            axisLine: { lineStyle: { color: '#9dcc18' } },
            axisLabel: { formatter: (value: number) => `${value} °C` },
          },
        },
      ],
    },
  },

  mixedCategoryExample: {
    data: [
      { trimestre: 'T1', produit: 120, service: 80, objectif: 180 },
      { trimestre: 'T2', produit: 150, service: 95, objectif: 210 },
      { trimestre: 'T3', produit: 135, service: 110, objectif: 230 },
      { trimestre: 'T4', produit: 180, service: 125, objectif: 250 },
    ],
    config: {
      title: 'Colonnes empilées et ligne objectif',
      ytitle: ['Chiffre d’affaires (k€)', 'Objectif (k€)'],
      series: [
        {
          data: { x: field('trimestre'), y: field('produit') },
          name: 'Produit',
          type: 'column',
          stack: 'ca',
          yAxisIndex: 0,
        },
        {
          data: { x: field('trimestre'), y: field('service') },
          name: 'Service',
          type: 'column',
          stack: 'ca',
          yAxisIndex: 0,
        },
        {
          data: { x: field('trimestre'), y: field('objectif') },
          name: 'Objectif',
          type: 'line',
          yAxisIndex: 1,
          yAxisConfig: {
            min: 0,
            splitNumber: 5,
            alignTicks: false,
            axisLine: { lineStyle: { color: '#555b82' } },
          },
        },
      ],
    },
  },

  pivotRowsExample: {
    data: PIVOT_ROWS_RESULT,
    config: {
      title: 'Pivot de donnees longues vers donnees larges',
      xtitle: 'Type d usage',
      ytitle: 'Consommation',
      series: [
        {
          data: { x: field('usage_type'), y: field('consumption_beneficiaire') },
          name: 'Beneficiaire',
          type: 'column',
        },
        {
          data: { x: field('usage_type'), y: field('consumption_titulaire') },
          name: 'Titulaire',
          type: 'column',
        },
        {
          data: { x: field('usage_type'), y: field('consumption_absent') },
          name: 'Categorie absente',
          type: 'line',
          color: '#9aa4b2',
        },
      ],
    },
  },
};
