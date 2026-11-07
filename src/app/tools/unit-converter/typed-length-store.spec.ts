import { TestBed } from '@angular/core/testing';
import { TypedLengthStore } from './typed-length-store';

describe('TypedLengthStore', () => {
  it('starts empty', () => {
    expect(TestBed.inject(TypedLengthStore).text()).toBe('');
  });

  it('keeps the text it was given', () => {
    const store = TestBed.inject(TypedLengthStore);

    store.setText('3 1/2"');

    expect(store.text()).toBe('3 1/2"');
  });

  it('keeps the text exactly as typed, spaces included', () => {
    const store = TestBed.inject(TypedLengthStore);

    store.setText('  5 ');

    expect(store.text()).toBe('  5 ');
  });

  it('can be cleared', () => {
    const store = TestBed.inject(TypedLengthStore);
    store.setText('5');

    store.setText('');

    expect(store.text()).toBe('');
  });

  it('writes nothing to browser storage', () => {
    TestBed.inject(TypedLengthStore).setText('5');

    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });
});
