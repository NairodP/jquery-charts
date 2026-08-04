# Snapshots visuels et plein écran

## Objectif

Ajouter à `jquery-organizer` une base commune pour copier un tableau ou un graphique tel qu'il est rendu au moment de la copie, puis le reproduire sur une autre page compatible. Ajouter ensuite un mode plein écran commun pour les tableaux et les graphiques.

Le snapshot doit être autonome pour la première version : il contient les données finales, la configuration sérialisable et l'état courant du composant.

## Décisions de conception

- Ne pas sérialiser directement `TableProvider` ou `ChartProvider` : ils peuvent contenir des fonctions et des callbacks.
- Stocker un format dédié, JSON, versionné et validé.
- Stocker plusieurs snapshots dans une collection unique `localStorage`.
- Chaque snapshot possède un identifiant UUID, un libellé, un type, une date et une version de schéma.
- La première version privilégie la fidélité du rendu final avec des données déjà chargées.
- Les fonctions, templates Angular, callbacks métier, providers réseau et données lazy non chargées sont hors périmètre MVP et doivent produire des avertissements plutôt qu'une erreur globale.
- Le collage applique les propriétés compatibles et retourne un rapport `restored`, `skipped`, `warnings`.
- `localStorage` est le stockage MVP ; la taille doit être contrôlée pour préparer une évolution vers IndexedDB.

## Format cible MVP

```typescript
interface VisualSnapshot {
  id: string;
  schemaVersion: 1;
  type: 'table' | 'chart';
  label: string;
  createdAt: string;
  updatedAt: string;
  config: Record<string, unknown>;
  state: Record<string, unknown>;
  data: unknown[];
  warnings?: string[];
}
```

La structure exacte sera typée dans `jquery-core` et adaptée par les bibliothèques concernées.

## Étapes d'implémentation

### Phase 1 - Socle partagé des snapshots

- [x] Créer ce document de suivi.
- [x] Ajouter les modèles `VisualSnapshot`, collection et résultat d'application dans `jquery-core`.
- [x] Ajouter une validation de schéma et une sérialisation JSON sûre.
- [x] Ajouter `VisualSnapshotStorage` avec création, liste, lecture, renommage, suppression et remplacement.
- [x] Gérer les erreurs de `localStorage`, le JSON corrompu, la taille maximale et les snapshots invalides.
- [x] Exporter le socle par `jquery-core/src/public-api.ts`.
- [ ] Ajouter les tests du stockage et de la validation.

### Phase 2 - Snapshot de tableau

- [x] Construire un snapshot à partir des lignes et de l'état réellement affichés.
- [x] Capturer colonnes, ordre, visibilité, largeurs, tri, recherche et groupement.
- [x] Capturer les options sérialisables et exclure les fonctions/templates.
- [x] Ajouter l'application d'un snapshot compatible à `jquery-table`.
- [x] Retourner les propriétés restaurées, ignorées, les données et les avertissements.
- [ ] Restaurer les slices, filtres de slices et pagination dans l'API de collage.
- [ ] Ajouter les tests de copie, collage et compatibilité partielle.

### Phase 3 - Snapshot de graphique

- [x] Capturer les données d'entrée et l'option finale résolue utilisée par ECharts.
- [x] Capturer type, séries, catégories, valeurs, couleurs, stacks, visibilité, axes, titres, dimensions et options sérialisables.
- [x] Capturer l'état Organizer et le thème/renderer.
- [x] Exclure les providers et callbacks non sérialisables avec avertissement.
- [x] Ajouter l'application d'un snapshot compatible à `jquery-echarts`.
- [ ] Ajouter les tests de copie, collage et compatibilité partielle.

### Phase 4 - Intégration Organizer

- [x] Ajouter l'action globale `Copier le visuel` dans le sous-menu `Actions`.
- [x] Regrouper le plein écran dans `Actions` sans bouton autonome dans le tableau ou le graphique.
- [x] Ajouter un feedback de copie local, configurable et l'événement `visualCopied` aux composants.
- [ ] Ajouter l'action `Coller une configuration`.
- [ ] Ajouter la liste des snapshots disponibles, avec type, libellé et date.
- [ ] Ajouter renommage, suppression et application.
- [ ] Afficher les avertissements de compatibilité sans bloquer le collage.
- [ ] Documenter le fonctionnement et les limites.

### Phase 5 - Plein écran

- [x] Créer un utilitaire partagé de coordination du plein écran.
- [x] Utiliser l'API Fullscreen native avec un style de fallback visuel.
- [x] Ajouter l'action et l'état plein écran à `jquery-table`.
- [x] Ajouter l'action et l'état plein écran à `jquery-echarts`.
- [x] Exposer le plein écran uniquement via le menu Organizer.
- [x] Reposer sur le `ResizeObserver` ECharts après les changements de taille.
- [x] Préserver les données, filtres, Organizer, tri et pagination du tableau pendant le mode plein écran.
- [x] Gérer `Escape` via la Fullscreen API et `fullscreenchange`.
- [ ] Ajouter les traductions via `JQT_I18N` et un fallback CSS complet.
- [ ] Ajouter les tests d'interface et de redimensionnement.

### Phase 6 - Validation finale

- [x] Build complet de l'application et builds ciblés des bibliothèques.
- [ ] Tests unitaires et tests de compatibilité.
- [ ] Vérification de plusieurs snapshots simultanés.
- [ ] Vérification tableau vers tableau et graphique vers graphique.
- [ ] Vérification des incompatibilités et données volumineuses.
- [ ] Vérification du plein écran sur desktop et mobile.
- [ ] Mise à jour des README et de la documentation de démonstration.

## Hors périmètre MVP

- Recréation automatique de fonctions JavaScript arbitraires.
- Recréation de templates Angular personnalisés.
- Rejeu automatique d'appels réseau.
- Copie de données non chargées ou de flux vivants.
- Synchronisation entre onglets.
- Stockage IndexedDB.

## Critères d'acceptation

1. Une copie contient les données affichées au moment de la copie.
2. Plusieurs tableaux et graphiques peuvent être copiés sans écrasement.
3. Un snapshot compatible restitue le même état visuel autant que les données et propriétés sérialisables le permettent.
4. Un snapshot partiellement compatible est appliqué avec un rapport explicite.
5. Le plein écran fonctionne pour un tableau et un graphique, avec action Organizer et sortie `Escape`.
6. Les composants restent compilables et leurs APIs existantes restent compatibles.

## Journal d'implémentation

### 2026-08-04

- Socle `jquery-core` ajouté : modèle versionné, validation, stockage multi-snapshots et gestionnaire plein écran.
- `jquery-table` expose `createVisualSnapshot()` et `applyVisualSnapshot()` avec lignes filtrées, colonnes, tri, recherche, groupement et dimensions.
- `jquery-echarts` expose `createVisualSnapshot()` et `applyVisualSnapshot()` avec données d'entrée, état Organizer et option ECharts finale sérialisable.
- Le menu Organizer du tableau regroupe désormais la copie et le plein écran dans un sous-menu `Actions`; le collage reste une action externe côté utilisateur.
- Une page de démonstration `/snapshots` permet de tester un graphique, un tableau et un dashboard vide alimenté par les snapshots disponibles.
- La page `/snapshots` utilise un parcours d'ajout en deux étapes : choix du type, puis choix du snapshot correspondant.
- Les boutons Organizer et `+` sont centrés; les boutons plein écran autonomes ont été retirés.
- Les feedbacks de copie apparaissent localement dans l'en-tête du visuel et peuvent être désactivés ou personnalisés.
- Les graphiques peuvent maintenant être restitués depuis leur `renderedOption` ECharts capturée, sans réhydrater les callbacks d'origine.
- Les builds ciblés `jquery-core` + `jquery-table` et `jquery-core` + `jquery-echarts` passent.
- Le plein écran natif est branché sur les wrappers table et chart; les tests et le fallback CSS complet restent à faire.
- Prochaine étape : ajouter les tests du stockage et des adaptateurs, puis intégrer les commandes Copier/Coller dans l'Organizer.

### Organisation visuelle retenue

- Le menu principal conserve les réglages de données et d'affichage : `Champs`, `Grouper par`, `Filtrer par`, `Template`, `Exporter` et `Préférences`.
- Les actions qui portent sur le visuel lui-même sont regroupées dans `Actions` : `Copier le visuel` et `Plein écran`.
- `Coller` n'est pas exposé dans l'Organizer : l'interface hôte choisit un emplacement et sélectionne un snapshot parmi ceux disponibles.
- `jquery-echarts` expose encore les APIs de snapshot et de plein écran, mais ne rend pas actuellement le bouton Organizer; son intégration UI devra être traitée avec le contrat de bouton partagé.
