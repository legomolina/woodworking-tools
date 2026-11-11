import { TestBed } from '@angular/core/testing';
import { BevelFenceCalculatorStore } from './bevel-fence-calculator.store';

describe('BevelFenceCalculatorStore', () => {
  it('starts empty with the Long Face given', () => {
    const store = TestBed.inject(BevelFenceCalculatorStore);

    expect([store.bevelAngle(), store.thickness(), store.length(), store.givenFace()]).toEqual([
      '',
      '',
      '',
      'long',
    ]);
  });

  it('keeps what was typed and the chosen face', () => {
    const store = TestBed.inject(BevelFenceCalculatorStore);

    store.setBevelAngle('45');
    store.setThickness('19 mm');
    store.setLength('300 mm');
    store.setGivenFace('short');

    expect([store.bevelAngle(), store.thickness(), store.length(), store.givenFace()]).toEqual([
      '45',
      '19 mm',
      '300 mm',
      'short',
    ]);
  });

  it('starts empty again in a fresh app', () => {
    TestBed.inject(BevelFenceCalculatorStore).setBevelAngle('30');
    TestBed.resetTestingModule();

    expect(TestBed.inject(BevelFenceCalculatorStore).bevelAngle()).toBe('');
  });
});
