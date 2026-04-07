const ts = require('typescript');
const path = require('path');

const configPath = ts.findConfigFile('./', ts.sys.fileExists, 'tsconfig.build.json');
const config = ts.readConfigFile(configPath, ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, './');
parsed.options.incremental = false;

const program = ts.createProgram(parsed.fileNames, parsed.options);
const result = program.emit();
const diagnostics = ts.getPreEmitDiagnostics(program).concat(result.diagnostics);

if (diagnostics.length > 0) {
  diagnostics.forEach(d => {
    const msg = ts.flattenDiagnosticMessageText(d.messageText, '\n');
    if (d.file) {
      const pos = d.file.getLineAndCharacterOfPosition(d.start);
      console.error(`${d.file.fileName}:${pos.line + 1}: ${msg}`);
    } else {
      console.error(msg);
    }
  });
  process.exit(1);
}

console.log(`Compiled ${parsed.fileNames.length} files to dist/`);
