import { convertDir } from './utils';
import { program } from 'commander';

async function main() {
  program.version('0.0.1');

  program
    .option<string>('-s, --srcDir <string>', 'Source directory', v => v)
    .option<string>('-o, --destDir <string>', 'Destination directory', v => v)
    .option<number>('-w, --maxWidth <number>', 'Image maximum width', parseInt)
    .option<number>('-h, --maxHeight <number>', 'Image maximum height', parseInt);

  program.parse(process.argv);

  if (!program.srcDir || !program.destDir) {
    program.outputHelp();
    return;
  }

  await convertDir(program.srcDir, program.destDir, program.maxWidth, program.maxHeight);
}


main().catch(err => console.error('Error: ', err));
