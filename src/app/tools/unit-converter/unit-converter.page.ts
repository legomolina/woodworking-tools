import { Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

/** The Unit Converter's page: its name and a short intro. */
@Component({
  selector: 'wt-unit-converter-page',
  imports: [TranslocoPipe],
  templateUrl: './unit-converter.page.html',
  styleUrl: './unit-converter.page.css',
})
export default class UnitConverterPage {}
