#!/usr/bin/env node
const { spawnSync } = require("child_process");
const fs = require("fs/promises");
const path = require("path");

const ROOT_DIR = path.resolve(path.join(__dirname, "..", "..", ".."));

async function main(dependencies) {
  const directory = "tools/all-dependencies";
  for (const dependency of dependencies) {
    const projectDirectory = path.join(ROOT_DIR, directory);
    const packageJsonPath = path.join(projectDirectory, "package.json");
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath));
    const dependencyVersion = packageJson.dependencies?.[dependency];
    const devDependencyVersion = packageJson.devDependencies?.[dependency];
    const optionalDependencyVersion =
      packageJson.optionalDependencies?.[dependency];
    const versions = [
      dependencyVersion,
      devDependencyVersion,
      optionalDependencyVersion,
    ].filter((it) => it);
    if (versions.length === 0) {
      throw new Error(
        `Can't find dependency ${dependency} in ${packageJsonPath}`
      );
    } else if (versions.length !== 1) {
      throw new Error(
        `Dependency ${dependency} is in both defined multiple times in ${filename}`
      );
    }
    await makeDependencyConsistent(
      projectDirectory,
      dependency,
      versions[0],
      devDependencyVersion
    );
  }
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
    installRunRush,
    "add",
    "-p",
    `${dependency}@${version}`,
    isDevDependency ? "--dev" : "",
    "--make-consistent",
    "--skip-update",
  ].filter((it) => it);
  console.log(`Executing: node ${args.join(" ")} (in ${directory})`);
  spawnSync("node", args, { cwd: directory, stdio: "inherit" });
}

if (require.main === module) {
  const argv = process.argv.slice(2);
  if (argv.length !== 1) {
    console.warn(
      `Expected one comma separated list of dependencies as arguments, got arguments`,
      argv
    );
    process.exit(1);
  }
  const dependencies = argv[0].split(", ");
  main(dependencies).catch((error) => {
    console.warn(error);
    process.exitCode = 1;
  });
}
