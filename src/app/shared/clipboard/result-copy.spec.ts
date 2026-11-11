import { Injector, runInInjectionContext, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CONFIRMATION_MS, resultCopy } from './result-copy';

function setup(): {
  source: ReturnType<typeof signal<string>>;
  copier: ReturnType<typeof resultCopy>;
} {
  const source = signal('a');
  const copier = runInInjectionContext(TestBed.inject(Injector), () => resultCopy(source));
  return { source, copier };
}

describe('resultCopy', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('writes an exact result as shown and confirms it', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    const { copier } = setup();

    await copier.copy({ label: 'Metres', value: '0.089 m' });

    expect(writeText).toHaveBeenCalledExactlyOnceWith('0.089 m');
    expect(copier.outcomes()).toEqual([{ unit: 'Metres', copied: true }]);
  });

  it('writes an approximate result without the ≈ marker', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    const { copier } = setup();

    await copier.copy({ label: 'Metres', value: '≈ 0.089 m', approximate: true });

    expect(writeText).toHaveBeenCalledExactlyOnceWith('0.089 m');
  });

  it('reports a failure when there is no clipboard', async () => {
    vi.stubGlobal('navigator', {});
    const { copier } = setup();

    await copier.copy({ label: 'Metres', value: '1 m' });

    expect(copier.outcomes()).toEqual([{ unit: 'Metres', copied: false }]);
  });

  it('reports a failure when the clipboard refuses', async () => {
    vi.stubGlobal('navigator', {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    });
    const { copier } = setup();

    await copier.copy({ label: 'Metres', value: '1 m' });

    expect(copier.outcomes()).toEqual([{ unit: 'Metres', copied: false }]);
  });

  it('forgets the outcome after the confirmation time', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
    const { copier } = setup();

    await copier.copy({ label: 'Metres', value: '1 m' });
    vi.advanceTimersByTime(CONFIRMATION_MS - 1);
    expect(copier.outcomes()).toHaveLength(1);
    vi.advanceTimersByTime(1);

    expect(copier.outcomes()).toEqual([]);
  });

  it('keeps a later outcome for its full time after a repeated copy', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
    const { copier } = setup();

    await copier.copy({ label: 'Metres', value: '1 m' });
    vi.advanceTimersByTime(CONFIRMATION_MS - 1000);
    await copier.copy({ label: 'Metres', value: '1 m' });
    vi.advanceTimersByTime(CONFIRMATION_MS - 1);

    expect(copier.outcomes()).toHaveLength(1);
  });

  it('empties the outcome when the source changes', async () => {
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
    const { source, copier } = setup();
    await copier.copy({ label: 'Metres', value: '1 m' });

    source.set('b');

    expect(copier.outcomes()).toEqual([]);
  });

  it('drops a copy that finishes after the source changed', async () => {
    let finish: () => void = () => undefined;
    const writeText = vi.fn().mockReturnValue(
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
    );
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    const { source, copier } = setup();

    const pending = copier.copy({ label: 'Metres', value: '1 m' });
    source.set('b');
    finish();
    await pending;

    expect(copier.outcomes()).toEqual([]);
  });
});
