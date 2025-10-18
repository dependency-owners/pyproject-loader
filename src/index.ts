import type { Dependency, DependencyLoader } from 'dependency-owners/loader';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  type LooseVersionSpec,
  parsePipRequirementsLineLoosely,
} from 'pip-requirements-js';
import { parse, type TomlTable } from 'smol-toml';

const mapDependency = (dependency: string): Dependency | undefined => {
  const { name, versionSpec = [] } =
    parsePipRequirementsLineLoosely(dependency) || {};
  if (!name) {
    return undefined;
  }
  const version = versionSpec
    .reduce((acc: string[], current: LooseVersionSpec) => {
      acc.push(`${current.operator}${current.version}`);
      return acc;
    }, [])
    .join(',');
  return {
    name,
    version,
  };
};

/**
 * Check if the loader can handle the specified file.
 * @param {string} filePath The path of the file to check.
 * @returns {Promise<boolean>} True if the file can be loaded, false otherwise.
 */
export const canLoad = async function (filePath: string): Promise<boolean> {
  return path.basename(filePath) === 'pyproject.toml';
} satisfies DependencyLoader['canLoad'];

/**
 * Loads the pyproject.toml file and returns its dependencies.
 * @param {string} filePath The path of the pyproject.toml file to load.
 * @returns {Promise<Dependency[]>} An array of dependencies.
 */
export const load = async function (filePath: string): Promise<Dependency[]> {
  const pyproject = parse(await fs.readFile(filePath, 'utf-8'));
  const project = pyproject.project as TomlTable | undefined;
  const dependencies = project?.dependencies as string[] | undefined;
  return (dependencies || [])
    .map(mapDependency)
    .filter(Boolean) as Dependency[];
} satisfies DependencyLoader['load'];
