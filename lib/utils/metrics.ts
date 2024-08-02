import chalk from 'chalk';
import readline from 'readline';

const hideCursor = () => process.stdout.write('\x1B[?25l');
const showCursor = () => process.stdout.write('\x1B[?25h');

export const measurePerformance = async <T>(
  action: () => Promise<T>,
  description: string,
  sendUpdate: (type: string, message: string) => void
): Promise<T> => {
  const startTime = performance.now();
  sendUpdate('notification', description);
  process.stdout.write(chalk.blue(`${description}\r`));

  const animation = ['', '.', '..', '...'];
  let i = 0;
  hideCursor();
  const interval = setInterval(() => {
    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0);
    process.stdout.write(
      chalk.blue(`${description}${animation[i % animation.length]}`)
    );
    i++;
  }, 500);

  try {
    const result = await action();
    const endTime = performance.now();
    clearInterval(interval);

    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0);
    process.stdout.write(
      chalk.blue(`${description}: `) +
        chalk.green('Completed') +
        chalk.cyan(' in ') +
        chalk.yellow(((endTime - startTime) / 1000).toFixed(2)) +
        chalk.cyan(' seconds\n')
    );
    return result;
  } catch (error) {
    const endTime = performance.now();
    clearInterval(interval);

    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0);
    process.stdout.write(
      chalk.blue(`${description}: `) +
        chalk.red('Failed') +
        chalk.cyan(' after ') +
        chalk.yellow(((endTime - startTime) / 1000).toFixed(2)) +
        chalk.cyan(' seconds\n')
    );
    throw error;
  } finally {
    clearInterval(interval);
    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0);
    showCursor();
    process.stdout.write('');
  }
};

export const getTotalTime = (
  totalStartTime: number,
  totalEndTime: number,
  sendUpdate: (type: string, message: string) => void
): void => {
  const totalTime = ((totalEndTime - totalStartTime) / 1000).toFixed(2);
  sendUpdate('metric', `Processes completed in ${totalTime} seconds`);

  process.stdout.write(
    chalk.magenta('Process completed in ') +
      chalk.yellow(totalTime) +
      chalk.magenta(' seconds\n')
  );
};
