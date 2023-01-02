#!/usr/bin/env node
import * as RushLib from "@microsoft/rush-lib";
import fs from "fs/promises";

const { RushConfiguration } = RushLib.default;

const THIS_PACKAGE_NAME = "@jonasb/datadata-all-dependencies";

function addDependencies({
  dependencies,
  packageDependencies,
  rushConfiguration,
}) {
  Object.entries(packageDependencies).forEach(([dependencyName, version]) => {
    if (!rushConfiguration.projectsByName.has(dependencyName)) {
      dependencies[dependencyName] = version;
    }
  });
}

function processPackage({ dependencies, project, rushConfiguration }) {
  [
    project.packageJson.dependencies,
    project.packageJson.devDependencies,
    project.packageJson.peerDependencies,
  ]
    .filter((it) => it)
    .forEach((packageDependencies) =>
      addDependencies({
        dependencies,
        packageDependencies,
        rushConfiguration,
      })
    );
}

function extractAllExternalDependencies() {
  const dependencies = {};
  const rushConfiguration = RushConfiguration.loadFromDefaultLocation({
    startingFolder: process.cwd(),
  });
  rushConfiguration.projects
    .filter((it) => it.packageName !== THIS_PACKAGE_NAME)
    .forEach((project) =>
      processPackage({
        dependencies,
        project,
        rushConfiguration,
      })
    );
  const sortedDependencies = Object.fromEntries(
    Object.entries(dependencies).sort((a, b) => a[0].localeCompare(b[0]))
  );
  return sortedDependencies;
}

async function updatePackageJson(dependencies) {
  const packageJson = JSON.parse(await fs.readFile("package.json"));
  packageJson.optionalDependencies = dependencies;
  await fs.writeFile(
    "package.json",
    JSON.stringify(packageJson, null, 2) + "\n"
  );
}

const dependencies = extractAllExternalDependencies();
await updatePackageJson(dependencies);
