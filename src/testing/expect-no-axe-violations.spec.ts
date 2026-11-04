import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { expectNoAxeViolations } from './expect-no-axe-violations';

@Component({
  selector: 'wt-unlabelled-input',
  template: `
    <main>
      <h1>Fixture</h1>
      <input id="board-length" type="text" />
    </main>
  `,
})
class UnlabelledInput {}

@Component({
  selector: 'wt-labelled-input',
  template: `
    <main>
      <h1>Fixture</h1>
      <label for="board-length">Board length</label>
      <input id="board-length" type="text" />
    </main>
  `,
})
class LabelledInput {}

describe('expectNoAxeViolations', () => {
  it('fails naming the rule and the offending element when the page has a violation', async () => {
    const fixture = TestBed.createComponent(UnlabelledInput);
    await fixture.whenStable();

    await expect(expectNoAxeViolations(fixture.nativeElement as HTMLElement)).rejects.toThrow(
      /^- label \(.*\n {4}at #board-length: <input id="board-length"/m,
    );
  });

  it('passes when the page has no violations', async () => {
    const fixture = TestBed.createComponent(LabelledInput);
    await fixture.whenStable();

    await expect(
      expectNoAxeViolations(fixture.nativeElement as HTMLElement),
    ).resolves.toBeUndefined();
  });
});
