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
});
