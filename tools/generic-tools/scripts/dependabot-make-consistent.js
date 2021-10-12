#!/usr/bin/env node
const { spawnSync } = require("child_process");
const fs = require("fs/promises");
const path = require("path");

const ROOT_DIR = path.resolve(path.join(__dirname, "..", "..", ".."));

async function main(prTitle) {
  const { dependency, directory } = extractInfoFromPrTitle(prTitle);

  const projectDirectory = path.join(ROOT_DIR, directory);
  const packageJsonPath = path.join(projectDirectory, "package.json");
  const packageJson = JSON.parse(await fs.readFile(packageJsonPath));
  const dependencyVersion = packageJson.dependencies?.[dependency];
  const devDependencyVersion = packageJson.devDependencies?.[dependency];
  if (!dependencyVersion && !devDependencyVersion) {
    throw new Error(
      `Can't find dependency ${dependency} in ${packageJsonPath}`
    );
  } else if (dependencyVersion && devDependencyVersion) {
    throw new Error(
      `Dependency ${dependency} is in both dependencies and devDependencies in ${filename}`
    );
  }
  const version = dependencyVersion ?? devDependencyVersion;

  await makeDependencyConsistent(
    projectDirectory,
    dependency,
    version,
    devDependencyVersion
  );
}

// e.g. build(deps-dev): bump @typescript-eslint/eslint-plugin from 4.33.0 to 5.0.0 in /libraries/graphql
function extractInfoFromPrTitle(prTitle) {
  const match = prTitle.match(/^.*bump (\S+).* in (\S+)$/);
  if (!match) {
    throw new Error(`PR title (${prTitle}) doesn't match expected format`);
  }
  return { dependency: match[1], directory: match[2] };
}

async function makeDependencyConsistent(
  directory,
  dependency,
  version,
  isDevDependency
) {
  const installRunRush = path.join(
    ROOT_DIR,
    "common",
    "scripts",
    "install-run-rush.js"
  );
  const args = [
    "node",
    installRunRush,
    "add",
    "-p",
    `${dependency}@${version}`,
    isDevDependency ? "--dev" : "",
    "--make-consistent",
    "--skip-update",
  ];
  console.log(`Executing: ${node} ${args.join(" ")} (in ${directory})`);
  spawnSync("/usr/bin/env", args, { cwd: directory, stdio: "inherit" });
}

if (require.main === module) {
  const argv = process.argv.slice(2);
  if (argv.length !== 1) {
    console.warn(`Expected PR title as argument, got arguments`, argv);
    process.exit(1);
  }
  main(argv[0]).catch((error) => {
    console.warn(error);
    process.exitCode = 1;
  });
}
