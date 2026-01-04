export interface ParsedArgs {
  _: string[];
  env: string[];
  yes?: boolean;
  noTweak?: boolean;
  tui?: boolean;
  noTui?: boolean;
  quick?: boolean;
  help?: boolean;
  ['no-prompt-pack']?: boolean;
  ['prompt-pack-mode']?: string;
  ['no-skill-install']?: boolean;
  ['skill-update']?: boolean;
  ['shell-env']?: boolean;
  ['no-shell-env']?: boolean;
  ['enable-team-mode']?: boolean;
  [key: string]: string | boolean | string[] | undefined;
}

export const parseArgs = (argv: string[]): ParsedArgs => {
  const opts: ParsedArgs = { _: [], env: [] };
  const args = [...argv];
  while (args.length > 0) {
    const arg = args.shift() as string;
    if (!arg.startsWith('-')) {
      opts._.push(arg);
      continue;
    }
    if (arg === '--yes') {
      opts.yes = true;
      continue;
    }
    if (arg === '--no-tweak') {
      opts.noTweak = true;
      continue;
    }
    if (arg === '--tui') {
      opts.tui = true;
      continue;
    }
    if (arg === '--quick' || arg === '--simple') {
      opts.quick = true;
      continue;
    }
    if (arg === '--no-tui') {
      opts.noTui = true;
      continue;
    }
    if (arg.startsWith('--env=')) {
      opts.env.push(arg.slice('--env='.length));
      continue;
    }
    if (arg === '--env') {
      const value = args.shift();
      if (value) opts.env.push(value);
      continue;
    }
    const [key, inlineValue] = arg.startsWith('--') ? arg.slice(2).split('=') : [null, null];
    if (!key) continue;
    const value = inlineValue ?? args.shift();
    if (value !== undefined) {
      opts[key] = value;
    } else {
      opts[key] = true;
    }
  }
  return opts;
};
