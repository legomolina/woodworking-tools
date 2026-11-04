import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideRouter, TitleStrategy } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { TranslocoService } from '@jsverse/transloco';
import { translocoTesting } from '../../../testing/transloco-testing';
import { TranslatedTitleStrategy } from './translated-title-strategy';

@Component({ selector: 'wt-blank-page', template: '' })
class BlankPage {}

async function setUp(): Promise<RouterTestingHarness> {
  TestBed.configureTestingModule({
    imports: [translocoTesting()],
    providers: [
      provideRouter([
        { path: '', component: BlankPage },
        { path: 'test-tool', title: 'tools.testTool.name', component: BlankPage },
      ]),
      { provide: TitleStrategy, useClass: TranslatedTitleStrategy },
    ],
  });
  return RouterTestingHarness.create();
}

describe('TranslatedTitleStrategy', () => {
  it('titles a page without its own title with the app name', async () => {
    const harness = await setUp();

    await harness.navigateByUrl('/');

    expect(TestBed.inject(Title).getTitle()).toBe('Woodworking Tools');
  });

  it("puts the page's translated title before the app name", async () => {
    const harness = await setUp();

    await harness.navigateByUrl('/test-tool');

    expect(TestBed.inject(Title).getTitle()).toBe('Test Tool – Woodworking Tools');
  });

  it('retranslates the title when the language changes', async () => {
    const harness = await setUp();
    await harness.navigateByUrl('/test-tool');

    TestBed.inject(TranslocoService).setActiveLang('es');

    expect(TestBed.inject(Title).getTitle()).toBe('Herramienta de prueba – Woodworking Tools');
  });
});
