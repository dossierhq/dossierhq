#!/usr/bin/env node
import * as RushLib from "@microsoft/rush-lib";
import fs from "fs/promises";

const { RushConfiguration } = RushLib.default;

const THIS_PACKAGE_NAME = "@dossierhq/all-dependencies";

/** In order of importance */
const DEPENDENCY_TYPES = ["dependencies", "devDependencies"];

function extractAllExternalDependencies() {
  let dependencyInfo = {}; // { packageName: { version, type } }

  const rushConfiguration = RushConfiguration.loadFromDefaultLocation({
    startingFolder: process.cwd(),
  });

  // Iterate in reverse order of importance so we only keep the most important (i.e. "dependencies" even if there's also a "devDependencies")
  for (const type of [...DEPENDENCY_TYPES].reverse()) {
    for (const project of rushConfiguration.projects) {
      if (project.packageName === THIS_PACKAGE_NAME) {
        // For this package, we only care about the rush-lib dependency which is needed to run this script
        const rushLibVer = project.packageJson[type]?.["@microsoft/rush-lib"];
        if (rushLibVer) {
          dependencyInfo["@microsoft/rush-lib"] = { version: rushLibVer, type };
        }
      } else {
        const dependenciesOfType = Object.entries(
          project.packageJson[type] ?? []
        );
        for (const [dependencyName, version] of dependenciesOfType) {
          // Skip dependencies in the monorepo
          if (!rushConfiguration.projectsByName.has(dependencyName)) {
            dependencyInfo[dependencyName] = { version, type };
          }
        }
      }
    }
  }

  // Sort by package name
  dependencyInfo = Object.fromEntries(
    Object.entries(dependencyInfo).sort((a, b) => a[0].localeCompare(b[0]))
  );

  const dependencies = collectDependenciesOfType(
    dependencyInfo,
    "dependencies"
  );
  const devDependencies = collectDependenciesOfType(
    dependencyInfo,
    "devDependencies"
  );

  return {
    dependencies,
    devDependencies,
  };
}

function collectDependenciesOfType(dependencyInfo, type) {
  const dependencies = {};
  for (const [packageName, { version, type: dependencyType }] of Object.entries(
    dependencyInfo
  )) {
    if (dependencyType === type) {
      dependencies[packageName] = version;
    }
  }
  return dependencies;
}

async function updatePackageJson({ dependencies, devDependencies }) {
  const packageJson = JSON.parse(await fs.readFile("package.json"));
  packageJson.dependencies = dependencies;
  packageJson.devDependencies = devDependencies;
  await fs.writeFile(
    "package.json",
    JSON.stringify(packageJson, null, 2) + "\n"
  );
}

const dependencies = extractAllExternalDependencies();
await updatePackageJson(dependencies);
