import assert from 'node:assert/strict';
import { suite, test } from 'node:test';
import { createFixture } from 'fs-fixture';
import { merge } from 'lodash-es';
import { stringify } from 'smol-toml';

import { canLoad, load } from '../src/index.ts';

suite('canLoad', () => {
  test('should return true for pyproject.toml file', async () => {
    const result = await canLoad('/some/path/pyproject.toml');
    assert.strictEqual(result, true);
  });

  test('should return false for non-pyproject.toml file', async () => {
    const result = await canLoad('/some/path/index.js');
    assert.strictEqual(result, false);
  });
});

suite('load', () => {
  const createPyproject = (overrides = {}) => {
    const defaultPyproject = {
      project: {
        name: 'test',
        version: '1.0.0',
      },
    };
    return stringify(merge(defaultPyproject, overrides));
  };

  test.only('should return dependencies', async () => {
    const fixture = await createFixture({
      'pyproject.toml': createPyproject({
        project: {
          dependencies: [
            'httpx',
            'gidgethub[httpx]>4.0.0',
            "django>2.1; os_name != 'nt'",
            "django>2.0; os_name == 'nt'",
          ],
        },
      }),
    });
    const deps = await load(fixture.getPath('pyproject.toml'));
    assert.ok(deps.some((dep) => dep.name === 'httpx' && dep.version === ''));
    assert.ok(
      deps.some((dep) => dep.name === 'gidgethub' && dep.version === '>4.0.0')
    );
    assert.ok(
      deps.some((dep) => dep.name === 'django' && dep.version === '>2.1')
    );
    assert.ok(
      deps.some((dep) => dep.name === 'django' && dep.version === '>2.0')
    );
  });

  test('should return empty array if no dependencies', async () => {
    const fixture = await createFixture({
      'pyproject.toml': createPyproject(),
    });
    const deps = await load(fixture.getPath('pyproject.toml'));
    assert.deepStrictEqual(deps, []);
  });
});
