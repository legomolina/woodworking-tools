import { calculateFencePosition, readBevelAngle } from './bevel-fence.calc';

/** Matches a number within floating-point noise (or `digits` decimals) of the expected one. */
function close(expected: number, digits: number): unknown {
  return expect.closeTo(expected, digits);
}

describe('readBevelAngle', () => {
  it.each([
    ['22.5', 22.5],
    ['22,5', 22.5],
    ['22.5°', 22.5],
    ['  22.5  °  ', 22.5],
    ['0', 0],
    ['45', 45],
    ['45°', 45],
    ['45.0', 45],
    ['7', 7],
    ['22.25', 22.25],
    ['-0', 0],
  ])('reads %j as %d degrees', (text, degrees) => {
    expect(readBevelAngle(text)).toEqual({ ok: true, degrees });
  });

  it.each(['', '   '])('reports %j as empty', (text) => {
    expect(readBevelAngle(text)).toEqual({ ok: false, error: 'empty' });
  });

  it.each(['abc', '°', '22.5.1', '22 5', '°22', '22°°', '1e1', '22.', '.5', '22.5 deg', '--5'])(
    'reports %j as unreadable',
    (text) => {
      expect(readBevelAngle(text)).toEqual({ ok: false, error: 'unreadable' });
    },
  );

  it.each(['45.1', '46', '90', '-1', '-0.5', '-22.5°', '100000'])(
    'reports %j as out of range',
    (text) => {
      expect(readBevelAngle(text)).toEqual({ ok: false, error: 'out-of-range' });
    },
  );
});

describe('calculateFencePosition', () => {
  it('gives the Fence Position and Short Face from the Long Face', () => {
    expect(
      calculateFencePosition({
        bevelAngleDegrees: 45,
        thicknessMillimetres: 19,
        givenFace: 'long',
        lengthMillimetres: 300,
      }),
    ).toEqual({
      ok: true,
      fencePositionMillimetres: close(281, 9),
      shortFaceMillimetres: close(281, 9),
      longFaceMillimetres: 300,
    });
  });

  it('gives the Fence Position and Long Face from the Short Face', () => {
    expect(
      calculateFencePosition({
        bevelAngleDegrees: 45,
        thicknessMillimetres: 19,
        givenFace: 'short',
        lengthMillimetres: 281,
      }),
    ).toEqual({
      ok: true,
      fencePositionMillimetres: 281,
      shortFaceMillimetres: 281,
      longFaceMillimetres: close(300, 9),
    });
  });

  it('gives equal faces at 0°', () => {
    for (const givenFace of ['long', 'short'] as const) {
      expect(
        calculateFencePosition({
          bevelAngleDegrees: 0,
          thicknessMillimetres: 19,
          givenFace,
          lengthMillimetres: 300,
        }),
      ).toEqual({
        ok: true,
        fencePositionMillimetres: 300,
        shortFaceMillimetres: 300,
        longFaceMillimetres: 300,
      });
    }
  });

  it('uses the tangent of the Bevel Angle at 30° (tan 30° = 1/√3)', () => {
    // 30 mm thick: the faces differ by 30 / √3 ≈ 17.3205 mm.
    expect(
      calculateFencePosition({
        bevelAngleDegrees: 30,
        thicknessMillimetres: 30,
        givenFace: 'long',
        lengthMillimetres: 100,
      }),
    ).toEqual({
      ok: true,
      fencePositionMillimetres: close(82.6795, 3),
      shortFaceMillimetres: close(82.6795, 3),
      longFaceMillimetres: 100,
    });
  });

  it('rejects a Long Face equal to the difference, carrying the minimum Long Face', () => {
    expect(
      calculateFencePosition({
        bevelAngleDegrees: 45,
        thicknessMillimetres: 19,
        givenFace: 'long',
        lengthMillimetres: 19,
      }),
    ).toEqual({
      ok: false,
      error: 'long-face-too-short',
      minimumLongFaceMillimetres: close(19, 9),
    });
  });

  it('rejects a Long Face shorter than the difference', () => {
    expect(
      calculateFencePosition({
        bevelAngleDegrees: 45,
        thicknessMillimetres: 19,
        givenFace: 'long',
        lengthMillimetres: 10,
      }),
    ).toEqual({
      ok: false,
      error: 'long-face-too-short',
      minimumLongFaceMillimetres: close(19, 9),
    });
  });

  it('rejects a Long Face of 0 at 0°, where the minimum is 0', () => {
    expect(
      calculateFencePosition({
        bevelAngleDegrees: 0,
        thicknessMillimetres: 19,
        givenFace: 'long',
        lengthMillimetres: 0,
      }),
    ).toEqual({ ok: false, error: 'long-face-too-short', minimumLongFaceMillimetres: 0 });
  });

  it('accepts a Long Face just above the difference', () => {
    expect(
      calculateFencePosition({
        bevelAngleDegrees: 45,
        thicknessMillimetres: 19,
        givenFace: 'long',
        lengthMillimetres: 19.5,
      }).ok,
    ).toBe(true);
  });

  it('never rejects a given Short Face', () => {
    expect(
      calculateFencePosition({
        bevelAngleDegrees: 45,
        thicknessMillimetres: 19,
        givenFace: 'short',
        lengthMillimetres: 1,
      }),
    ).toEqual({
      ok: true,
      fencePositionMillimetres: 1,
      shortFaceMillimetres: 1,
      longFaceMillimetres: close(20, 9),
    });
  });
});
