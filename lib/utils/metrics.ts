import chalk from 'chalk';

export const measurePerformance = async <T>(
  action: () => Promise<T>,
  description: string,
  sendUpdate: (type: string, message: string) => void
): Promise<T> => {
  const startTime = performance.now();
  sendUpdate('notification', description);
  process.stdout.write(chalk.blue(`${description}\r`));

  const animation = ['.', '..', '...'];
  let i = 0;
  const interval = setInterval(() => {
    process.stdout.write(
      chalk.blue(`${description}${animation[i % animation.length]}\r`)
    );
    i++;
  }, 500);

  const result = await action();
  clearInterval(interval);

  const endTime = performance.now();
  process.stdout.write(
    chalk.blue(`${description}: `) +
      chalk.green('Completed in ') +
      chalk.red(((endTime - startTime) / 1000).toFixed(2)) +
      chalk.green(' seconds\n')
  );
  return result;
};

export const getTotalTime = (
  totalStartTime: number,
  totalEndTime: number,
  sendUpdate: (type: string, message: string) => void
): void => {
  const totalTime = ((totalEndTime - totalStartTime) / 1000).toFixed(2);
  sendUpdate('notification', `Total process completed in ${totalTime} seconds`);

  process.stdout.write(
    chalk.magenta('Total process completed in ') +
      chalk.red(totalTime + chalk.magenta(' seconds\n'))
  );
};
