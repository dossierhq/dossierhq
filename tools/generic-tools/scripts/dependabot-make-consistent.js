#!/usr/bin/env node
const { exec } = require("child_process");
const fs = require("fs/promises");
const path = require("path");
const { promisify } = require("util");

const ROOT_DIR = path.resolve(path.join(__dirname, "..", "..", ".."));

async function main() {
  const result = await extractNewDependencyVersionsFromLastCommit();

  for (const { filename, dependency, version } of result) {
    const packageJsonPath = path.join(ROOT_DIR, filename);
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath));
    const isDependency = !!packageJson.dependencies?.[dependency];
    const isDevDependency = !!packageJson.devDependencies?.[dependency];
    if (!isDependency && !isDevDependency) {
      throw new Error(`Can't find dependency ${dependency} in ${filename}`);
    } else if (isDependency && isDevDependency) {
      throw new Error(
        `Dependency ${dependency} is in both dependencies and devDependencies in ${filename}`
      );
    }
    await makeDependencyConsistent(
      path.dirname(packageJsonPath),
      dependency,
      version,
      isDevDependency
    );
  }
}

async function extractNewDependencyVersionsFromLastCommit() {
  console.log(`Executing: git show`);
  const { stdout: gitShow } = await promisify(exec)("git show");

  const result = [];
  let currentPackageJson = "";
  for (const line of gitShow.split("\n")) {
    const diffFileHeaderMatch = line.match(/^diff --git a\/(.+) b\/(.+)$/);
    if (diffFileHeaderMatch) {
      const [, aFilename, bFileName] = diffFileHeaderMatch;
      if (aFilename !== bFileName) {
        throw new Error(
          `Unexpected different filenames (${aFilename}) != (${bFileName})`
        );
      }
      if (!aFilename.endsWith("package.json")) {
        throw new Error(
          `Unexpected filename (only expects package.json): ${aFilename}`
        );
      }
      currentPackageJson = aFilename;
      console.log("Found diff for file", currentPackageJson);
    }

    const newDependencyMatch = line.match(/^\+\s*"([^"]+)"\s*:\s*"([^"]+)",?$/);
    if (newDependencyMatch) {
      const [, dependency, version] = newDependencyMatch;
      console.log(`Found new dependency version ${dependency}@${version}`);
      if (!currentPackageJson) {
        throw new Error("No filename specified for diff");
      }
      result.push({ filename: currentPackageJson, dependency, version });
    }
  }
  return result;
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
  const cmd = `node ${installRunRush} add -p "${dependency}@${version}" ${
    isDevDependency ? "--dev" : ""
  } --make-consistent`;
  console.log(`Executing: ${cmd} (in ${directory})`);
  const { stdout, stderr } = await promisify(exec)(cmd, { cwd: directory });
  if (stdout) {
    console.log(stdout);
  }
  if (stderr) {
    console.warn(stderr);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.warn(error);
    process.exitCode = 1;
  });
}
