/**
 * CLI entry point - routes commands to handlers
 */

import { parseArgs } from './args.js';
import { printHelp, printHaiku } from './help.js';
import { runTui, shouldLaunchTui } from './tui.js';
import {
  runListCommand,
  runDoctorCommand,
  runRemoveCommand,
  runTweakCommand,
  runUpdateCommand,
  runCreateCommand,
  runTasksCommand,
} from './commands/index.js';

const main = async () => {
  const argv = process.argv.slice(2);

  // Default to TUI when no arguments provided (and TTY available)
  if (argv.length === 0 && process.stdout.isTTY) {
    await runTui();
    return;
  }

  let cmd = argv.length > 0 && !argv[0].startsWith('-') ? (argv.shift() as string) : 'create';
  const opts = parseArgs(argv);
  const quickMode = cmd === 'quick' || Boolean(opts.quick || opts.simple);
  if (cmd === 'quick') cmd = 'create';

  // Help command (only for main help, not subcommand help)
  // Subcommands like 'tasks' handle their own --help
  const commandsWithOwnHelp = ['tasks'];
  if (cmd === 'help' || cmd === '--help' || (opts.help && !commandsWithOwnHelp.includes(cmd))) {
    printHelp();
    return;
  }

  // Easter egg: --haiku prints a random haiku
  if (opts.haiku) {
    printHaiku();
    return;
  }

  // TUI mode
  if (shouldLaunchTui(cmd, opts)) {
    await runTui();
    return;
  }

  // Route to command handlers
  switch (cmd) {
    case 'list':
      runListCommand({ opts });
      break;

    case 'doctor':
      runDoctorCommand({ opts });
      break;

    case 'update':
      runUpdateCommand({ opts });
      break;

    case 'remove':
      runRemoveCommand({ opts });
      break;

    case 'tweak':
      runTweakCommand({ opts });
      break;

    case 'create':
      await runCreateCommand({ opts, quickMode });
      break;

    case 'tasks':
      await runTasksCommand({ opts });
      break;

    default:
      printHelp();
  }
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
