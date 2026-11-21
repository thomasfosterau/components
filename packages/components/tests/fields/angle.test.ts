import { describe, expect, test } from 'vite-plus/test';
import {
  angleToPoint,
  angleToValue,
  compass8,
  compass16,
  compassName,
  nearestMark,
  pointToAngle,
  stepBy,
} from '../../src/lib/fields/angle.ts';

const full = { min: 0, max: 360, step: 1, wrap: true };

describe('pointToAngle', () => {
  test('north zero: up is 0 and clockwise increases', () => {
    expect(pointToAngle(0, -10, 'north')).toBe(0);
    expect(pointToAngle(10, 0, 'north')).toBe(90);
    expect(pointToAngle(0, 10, 'north')).toBe(180);
    expect(pointToAngle(-10, 0, 'north')).toBe(270);
  });

  test('east zero: right is 0, still clockwise on screen', () => {
    expect(pointToAngle(10, 0, 'east')).toBe(0);
    expect(pointToAngle(0, 10, 'east')).toBe(90);
  });

  test('round-trips with angleToPoint', () => {
    for (const zero of ['north', 'east'] as const) {
      const point = angleToPoint(135, zero, 10);
      expect(pointToAngle(point.x, point.y, zero)).toBeCloseTo(135);
    }
  });
});

describe('angleToValue', () => {
  test('a full circle is the angle itself, snapped to the step', () => {
    expect(angleToValue(134.6, full)).toBe(135);
    expect(angleToValue(12, { ...full, step: 5 })).toBe(10);
  });

  test('outside a part range goes to the nearer end', () => {
    const half = { min: 0, max: 180, step: 1, wrap: false };
    expect(angleToValue(200, half)).toBe(180);
    expect(angleToValue(340, half)).toBe(0);
  });
});

describe('stepBy', () => {
  test('wraps a full circle, clamps otherwise', () => {
    expect(stepBy(359, 1, full)).toBe(0);
    expect(stepBy(0, -1, full)).toBe(359);
    expect(stepBy(180, 1, { min: 0, max: 180, step: 1, wrap: false })).toBe(180);
  });
});

test('nearestMark measures round the circle', () => {
  expect(nearestMark(350, [0, 90, 180, 270])).toBe(0);
  expect(nearestMark(100, [0, 90, 180, 270])).toBe(90);
});

test('compassName', () => {
  expect(compassName(135, compass8)).toBe('south-east');
  expect(compassName(350, compass8)).toBe('north');
  expect(compassName(22.5, compass16)).toBe('north-north-east');
});
