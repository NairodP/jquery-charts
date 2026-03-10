import { Directive, Input, TemplateRef } from '@angular/core';

/**
 * Directive permettant de définir un template de cellule personnalisé pour une colonne.
 *
 * Usage:
 * ```html
 * <jquery-table [config]="tableConfig">
 *   <ng-template jqtCellDef="monKey" let-row>
 *     <span>{{ row.monChamp }}</span>
 *   </ng-template>
 * </jquery-table>
 * ```
 * Le contexte expose `$implicit` (ligne brute `T`) et `index` (index global).
 */
@Directive({
  selector: '[jqtCellDef]',
  standalone: true,
})
export class JqtCellDefDirective {
  /** Clé de la colonne à laquelle ce template s'applique. */
  @Input('jqtCellDef') columnKey: string = '';

  constructor(public readonly template: TemplateRef<{ $implicit: any; index: number }>) {}
}
