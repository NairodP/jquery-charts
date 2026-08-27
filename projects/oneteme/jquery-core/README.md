# @oneteme/jquery-core

Modeles et transformations de donnees partages par les bibliotheques de graphiques `@oneteme`.

## Coordonnees de series

Une serie accepte soit des fournisseurs TypeScript, soit des cles serialisables. Utilisez les fournisseurs lorsque la projection est calculee dans le code :

```typescript
import { field } from '@oneteme/jquery-core';

data: { x: field('month'), y: field('revenue') }
```

Utilisez `xField` et `yField` pour les configurations stockees en JSON ou recues d'une API :

```typescript
data: { xField: 'month', yField: 'revenue' }
```

Les deux cles doivent etre des chaines non vides. Les fonctions ne doivent pas etre serializees avec `JSON.stringify`.

This library was generated with [Angular CLI](https://github.com/angular/angular-cli) version 16.1.0.

## Code scaffolding

Run `ng generate component component-name --project jquery-core` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module --project jquery-core`.
> Note: Don't forget to add `--project jquery-core` or else it will be added to the default project in your `angular.json` file. 

## Build

Run `ng build jquery-core` to build the project. The build artifacts will be stored in the `dist/` directory.

## Publishing

After building your library with `ng build jquery-core`, go to the dist folder `cd dist/jquery-core` and run `npm publish`.

## Running unit tests

Run `ng test jquery-core` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
