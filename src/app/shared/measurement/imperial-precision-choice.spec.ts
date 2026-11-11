import { TestBed } from '@angular/core/testing';
import { translocoTesting } from '../../../testing/transloco-testing';
import { SettingsStore } from '../../core/settings/settings-store';
import { ImperialPrecisionChoice, imperialPrecisionOptions } from './imperial-precision-choice';

function setup(): { choice: ImperialPrecisionChoice; settings: SettingsStore } {
  TestBed.configureTestingModule({ imports: [translocoTesting()] });
  return {
    choice: TestBed.inject(ImperialPrecisionChoice),
    settings: TestBed.inject(SettingsStore),
  };
}

describe('ImperialPrecisionChoice', () => {
  it('offers 1/8, 1/16, 1/32 and 1/64 with the given unit word', () => {
    expect(imperialPrecisionOptions('in')).toEqual([
      { value: '8', label: '1/8 in' },
      { value: '16', label: '1/16 in' },
      { value: '32', label: '1/32 in' },
      { value: '64', label: '1/64 in' },
    ]);
  });

  it('starts at the global precision, as a string', () => {
    const { choice } = setup();

    expect(choice.value()).toBe('16');
  });

  it('sets the global precision from a select value', () => {
    const { choice, settings } = setup();

    choice.choose('32');

    expect(settings.imperialPrecision()).toBe(32);
    expect(choice.value()).toBe('32');
  });

  it('ignores a value that is not an Imperial precision', () => {
    const { choice, settings } = setup();

    choice.choose('10');
    choice.choose('');

    expect(settings.imperialPrecision()).toBe(16);
  });
});
