/**
 * Unit tests for the Mapbox Static Images URL builder.
 *
 * A URL is the one thing about a map that can be asserted without a browser,
 * and it is either the one Mapbox expects or a 404 — so this file is the whole
 * of `StaticMap`'s correctness that a picture could never show.
 *
 * @module tests/static-url
 */

import { describe, expect, it } from 'vite-plus/test';
import { staticMapUrl, type StaticMapRequest } from '../src/lib/static-url.ts';

describe('staticMapUrl', () => {
  const style = { username: 'mapbox', styleId: 'outdoors-v12' };
  const base = { style, width: 640, height: 360, accessToken: 'pk.test' };

  it('appends the access token — without it every request is a 401', () => {
    const url = new URL(
      staticMapUrl({
        ...base,
        view: { kind: 'camera', camera: { centre: { longitude: 1, latitude: 2 }, zoom: 3 } },
      }),
    );
    expect(url.searchParams.get('access_token')).toBe('pk.test');
  });

  it('writes the camera as lon,lat,zoom,bearing,pitch', () => {
    const url = staticMapUrl({
      ...base,
      view: {
        kind: 'camera',
        camera: {
          centre: { longitude: 144.963, latitude: -37.814 },
          zoom: 13,
          bearing: 20,
          pitch: 45,
        },
      },
    });
    expect(url).toContain('/static/144.963,-37.814,13,20,45/640x360');
  });

  it('defaults bearing and pitch to zero', () => {
    const url = staticMapUrl({
      ...base,
      view: { kind: 'camera', camera: { centre: { longitude: 1, latitude: 2 }, zoom: 3 } },
    });
    expect(url).toContain('/static/1,2,3,0,0/640x360');
  });

  it('writes a bounding box as [minLon,minLat,maxLon,maxLat]', () => {
    // The easy bug here writes `max.longitude` twice; a box that is a line is a
    // request Mapbox answers with the wrong picture rather than an error.
    const url = staticMapUrl({
      ...base,
      view: {
        kind: 'bbox',
        bbox: { min: { longitude: 1, latitude: 2 }, max: { longitude: 3, latitude: 4 } },
      },
    });
    expect(decodeURIComponent(url)).toContain('/static/[1,2,3,4]/640x360');
  });

  it('reads options forwarded as `undefined` as absent (#76)', () => {
    // A wrapper forwarding its own optional settings unconditionally. Under
    // `exactOptionalPropertyTypes` this only type-checks while
    // `StaticMapRequest` and `MapCamera` declare them `T | undefined`.
    const settings: {
      readonly bearing?: number | undefined;
      readonly pitch?: number | undefined;
      readonly retina?: boolean | undefined;
    } = {};
    const centre = { longitude: 1, latitude: 2 };
    const forwarded: StaticMapRequest = {
      ...base,
      view: {
        kind: 'camera',
        camera: { centre, zoom: 3, bearing: settings.bearing, pitch: settings.pitch },
      },
      retina: settings.retina,
    };
    expect(staticMapUrl(forwarded)).toBe(
      staticMapUrl({ ...base, view: { kind: 'camera', camera: { centre, zoom: 3 } } }),
    );
    expect(staticMapUrl(forwarded)).toContain('/static/1,2,3,0,0/640x360?');
  });

  it('asks for the 2× raster only when told to', () => {
    const view = { kind: 'auto' } as const;
    expect(staticMapUrl({ ...base, view })).toContain('/640x360?');
    expect(staticMapUrl({ ...base, view, retina: true })).toContain('/640x360@2x?');
  });

  it('encodes a GeoJSON overlay so its punctuation cannot be read as the path’s', () => {
    const url = staticMapUrl({
      ...base,
      view: { kind: 'auto' },
      overlay: { type: 'Point', coordinates: [1, 2] },
    });
    expect(url).not.toContain('{"type"');
    expect(decodeURIComponent(url)).toContain('geojson({"type":"Point","coordinates":[1,2]})');
  });
});
