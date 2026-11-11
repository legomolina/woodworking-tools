import { Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

/** The Bevel Fence Calculator's page. */
@Component({
  selector: 'wt-bevel-fence-calculator-page',
  imports: [TranslocoPipe],
  templateUrl: './bevel-fence-calculator.page.html',
  styleUrl: './bevel-fence-calculator.page.css',
})
export default class BevelFenceCalculatorPage {}
