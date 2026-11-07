import { Icon } from '../shared/ui/icon/icon';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { TOOL_REGISTRY } from '../core/tool-registry/tool-registry';

/** The landing page: every registered Tool, each linking to its own page. */
@Component({
  selector: 'wt-home-page',
  imports: [Icon, RouterLink, TranslocoPipe],
  templateUrl: './home.page.html',
  styleUrl: './home.page.css',
})
export default class HomePage {
  protected readonly tools = inject(TOOL_REGISTRY);
}
