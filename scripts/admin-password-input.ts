import {stdin, stdout} from 'node:process';

export async function hiddenPassword(label: string): Promise<string> {
  if (!stdin.isTTY || !stdout.isTTY) throw new Error('Use an interactive terminal or provide SUPER_ADMIN_PASSWORD through private environment configuration.');
  stdout.write(label);
  stdin.setRawMode(true);
  stdin.resume();
  return new Promise((resolve, reject) => {
    let value = '';
    const finish = () => {stdin.off('data', onData); stdin.setRawMode(false); stdin.pause(); stdout.write('\n');};
    const onData = (data: Buffer) => {
      for (const character of data.toString('utf8')) {
        if (character === '\u0003') {finish(); reject(new Error('Bootstrap cancelled.')); return;}
        if (character === '\r' || character === '\n') {finish(); resolve(value); return;}
        if (character === '\u007f' || character === '\b') value = value.slice(0, -1);
        else if (character >= ' ') value += character;
      }
    };
    stdin.on('data', onData);
  });
}
