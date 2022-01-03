#!/usr/bin/env node
const fs = require('fs/promises');
const path = require('path');
const ts = require('typescript');

function rewrittenRelativeImport(moduleSpecifier) {
  if (moduleSpecifier.endsWith('.')) moduleSpecifier += '/';
  if (moduleSpecifier.endsWith('/')) moduleSpecifier += 'index.js';
  if (!moduleSpecifier.endsWith('.js')) moduleSpecifier += '.js';
  return moduleSpecifier;
}

function rewriteNpmImport(package, _version) {
  return package;
}

function rewriteImportExportModuleSpecifier(moduleSpecifier, dependencies) {
  const isRelative = moduleSpecifier.startsWith('.');
  let rewritten = moduleSpecifier;
  if (isRelative) {
    rewritten = rewrittenRelativeImport(rewritten);
  } else {
    const version = dependencies[moduleSpecifier];
    if (version) {
      rewritten = rewriteNpmImport(moduleSpecifier, version);
    }
  }
  return rewritten;
}

function rewriteImports(context) {
  const packageJson = require('./package.json');
  const { dependencies } = packageJson;

  return (sourceFile) => {
    function visitor(node) {
      if (ts.isImportDeclaration(node)) {
        const moduleSpecifier = node.moduleSpecifier.text;
        const rewritten = rewriteImportExportModuleSpecifier(moduleSpecifier, dependencies);
        if (moduleSpecifier !== rewritten) {
          return context.factory.updateImportDeclaration(
            node,
            node.decorators,
            node.modifiers,
            node.importClause,
            context.factory.createStringLiteral(rewritten)
          );
        }
      } else if (ts.isExportDeclaration(node)) {
        const moduleSpecifier = node.moduleSpecifier?.text;
        if (moduleSpecifier) {
          const rewritten = rewriteImportExportModuleSpecifier(moduleSpecifier, dependencies);
          if (moduleSpecifier !== rewritten) {
            return context.factory.updateExportDeclaration(
              node,
              node.decorators,
              node.modifiers,
              node.isTypeOnly,
              node.exportClause,
              context.factory.createStringLiteral(rewritten)
            );
          }
        }
      }

      return ts.visitEachChild(node, visitor, context);
    }
    return ts.visitNode(sourceFile, visitor);
  };
}

async function buildTypescript(basePath) {
  const configFileName = ts.findConfigFile(basePath, ts.sys.fileExists, 'tsconfig.deno.json');
  const configFile = ts.readConfigFile(configFileName, ts.sys.readFile);
  if (configFile.error) {
    handleDiagnosticError(configFile.error);
  }
  configFile.compilerOptions = { ...configFile.compilerOptions };
  const commandLine = ts.parseJsonConfigFileContent(configFile.config, ts.sys, basePath);

  if (commandLine.errors.length > 0) {
    handleDiagnosticErrors(commandLine.errors);
  }
  const compilerOptions = commandLine.options;
  const program = ts.createProgram({
    rootNames: commandLine.fileNames,
    options: compilerOptions,
  });
  const emitResult = program.emit(undefined, undefined, undefined, undefined, {
    after: [rewriteImports],
    afterDeclarations: [rewriteImports],
  });
  if (emitResult.errors?.length > 0) {
    handleDiagnosticErrors(emitResult.errors);
  }
  const preEmitDiagnostics = ts.getPreEmitDiagnostics(program);
  if (preEmitDiagnostics.length > 0) {
    handleDiagnosticErrors(preEmitDiagnostics);
  }

  const files = await findFilesRecursive(compilerOptions.outDir, (filename) =>
    filename.endsWith('.js')
  );
  for (const outputJsFile of files) {
    let contents = await fs.readFile(outputJsFile, { encoding: 'utf-8' });
    const basename = path.basename(outputJsFile);
    contents = `/// <reference types="./${basename.slice(0, -3)}.d.ts" />\n${contents}`;
    await fs.writeFile(outputJsFile, contents);
  }
}

async function findFilesRecursive(directory, filter) {
  const entries = (await fs.readdir(directory)).map((f) => `${directory}/${f}`);
  const result = entries.filter(filter);
  for (const entry of entries) {
    const stat = await fs.stat(entry);
    if (stat.isDirectory()) {
      result.push(...(await findFilesRecursive(entry, filter)));
    }
  }
  return result;
}

function handleDiagnosticError(error) {
  console.log(
    ts.formatDiagnostic(error, {
      getCanonicalFileName: (path) => path,
      getCurrentDirectory: ts.sys.getCurrentDirectory,
      getNewLine: () => ts.sys.newLine,
    })
  );
  throw new Error();
}

function handleDiagnosticErrors(errors) {
  console.log(
    ts.formatDiagnosticsWithColorAndContext(errors, {
      getCanonicalFileName: (path) => path,
      getCurrentDirectory: ts.sys.getCurrentDirectory,
      getNewLine: () => ts.sys.newLine,
    })
  );
  throw new Error();
}

buildTypescript(process.cwd()).catch((error) => {
  console.log(error);
  process.exit(1);
});
