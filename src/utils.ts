import * as Fs from 'fs';
import * as Path from 'path';
import * as sharp from 'sharp';
import * as filesize from 'filesize';
import * as chalk from 'chalk';

function existsAsync(path: string): Promise<boolean> {
  return new Promise<boolean>(resolve => {
    try {
      const ok = Fs.existsSync(path);
      resolve(ok);
    } catch (error) {
      resolve(false);
    }
  });
}

function isDirAsync(path: string): Promise<boolean> {
  return new Promise<boolean>(resolve => {
    try {
      const ok = Fs.lstatSync(path).isDirectory();
      resolve(ok);
    } catch (error) {
      resolve(false);
    }
  });
}

function isFileAsync(path: string): Promise<boolean> {
  return new Promise<boolean>(resolve => {
    try {
      const ok = Fs.lstatSync(path).isFile();
      resolve(ok);
    } catch (error) {
      resolve(false);
    }
  });
}

function deleteFileAsync(path: string): Promise<boolean> {
  return new Promise<boolean>(resolve => {
    try {
      Fs.unlinkSync(path);
      resolve(true);
    } catch (error) {
      resolve(false);
    }
  });
}

async function getFilesAsync(dirPath: string): Promise<string[]> {
  return new Promise(resolve => {
    Fs.readdir(dirPath, (error, result) => {
      if (error) {
        resolve([]);
      } else {
        resolve(result);
      }
    });
  });
}

async function deleteDirAsync(dir: string): Promise<void> {
  if (!(await existsAsync(dir))) return;

  const files = await getFilesAsync(dir);

  for (const file of files) {
    const fullPath = Path.join(dir, file);
    if (await isDirAsync(fullPath)) {
      await deleteDirAsync(fullPath);
    } else if (await isFileAsync(fullPath)) {
      await deleteFileAsync(fullPath);
    }
  }

  await removeDirAsync(dir);
}

async function removeDirAsync(path: string): Promise<boolean> {
  return new Promise<boolean>(resolve => {
    try {
      Fs.rmdirSync(path);
      resolve(true);
    } catch (error) {
      resolve(false);
    }
  });
}

async function makeDirAsync(path: string): Promise<boolean> {
  return new Promise<boolean>(resolve => {
    try {
      Fs.mkdirSync(path);
      resolve(true);
    } catch (error) {
      resolve(false);
    }
  });
}

async function init(src: string, dest: string): Promise<void> {
  await deleteDirAsync(dest);
  await makeDirAsync(dest);
  if (!(await existsAsync(src))) {
    await makeDirAsync(src);
  }
}

function joinPath(...paths: string[]): string {
  return Path.join(...paths);
}

//function getFileName(filePath: string): string => Path.parse(filePath).name;

function getFileSizeAsync(path: string): Promise<number> {
  return new Promise<number>(resolve => {
    try {
      resolve(Fs.lstatSync(path).size);
    } catch (error) {
      resolve(0);
    }
  });
}

async function convertFile(srcPath: string, destPath: string, maxWidth: number, maxHeight: number): Promise<boolean> {
  try {
    let s = sharp(srcPath);
    if (maxWidth != null || maxHeight != null) {
      s = s.resize(undefined, 1080, { withoutEnlargement: true });
    }
    await s.webp().toFile(destPath);
    return true;
  } catch (error) { }
  return false;
}

function printLine(srcFile: string, destFile: string, srcSize: number, destSize: number, max: number) {
  const percent = Math.round(destSize / srcSize * 10000) / 100.0;

  let from = `${srcFile} (${filesize(srcSize)})`;
  from = from.padEnd(max);

  let to = `${destFile} (${filesize(destSize)})`;
  to = to.padEnd(max);

  console.log( `${chalk.yellow(from)}  ${chalk.green(to)} ${percent} %` );
}

export async function convertDir(srcDir: string, destDir: string, maxWidth: number, maxHeight: number) {
  const cwd = process.cwd();
  if (!Path.isAbsolute(srcDir)) {
    srcDir = Path.resolve(cwd, srcDir);
  }
  if (!Path.isAbsolute(destDir)) {
    destDir = Path.resolve(cwd, destDir);
  }

  if (!(await existsAsync(srcDir))) {
    throw new Error('Source directory not found');
  }

  try {
    await init(srcDir, destDir);

    const files = await getFilesAsync(srcDir);
    let total = 0
    let srcTotal = 0
    let destTotal = 0

    const max = Math.max(...files.map(x => x.length)) + 12;

    for (const file of files) {
      const srcFile = joinPath(srcDir, file);
      const srcName = Path.parse(srcFile).name;
      const destFile = joinPath(destDir, `${srcName}.webp`);
      const destFileName = Path.parse(destFile).base;
      const ok = await convertFile(srcFile, destFile, maxWidth, maxHeight);
      if (ok) {
        total++;
        const srcSize = await getFileSizeAsync(srcFile);
        const destSize = await getFileSizeAsync(destFile);
        srcTotal += srcSize;
        destTotal += destSize;
        printLine(file, destFileName, srcSize, destSize, max);
      } else {
        console.log(chalk.red(`Failed ${srcFile}`));
      }
    }

    console.log('\nSummary:');
    const percentTotal = srcTotal == 0 ? 0 : Math.round(destTotal / srcTotal * 10000) / 100.0
    console.log(chalk.white(`          Files: `) + chalk.bold.green(`${total}`));
    console.log(chalk.white(`Total Size(src): `) + chalk.bold.green(`${filesize(srcTotal)}`));
    console.log(chalk.white(`Total Size(dst): `) + chalk.bold.green(`${filesize(destTotal)}`));
    console.log(chalk.white(`        Percent: `) + chalk.bold.green(`${percentTotal} %`));

  } catch (e) {
    throw new Error(e);
  }
}
