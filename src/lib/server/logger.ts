import { dev } from '$app/environment';

/**
 * ANSI escape codes for misc things (reset, bold, hidden etc...)
 */
const terminal = {
	reset: '\x1b[0m',
	bold: '\x1b[1m',
	dim: '\x1b[2m',
	underscore: '\x1b[4m',
	blink: '\x1b[5m',
	reverse: '\x1b[7m',
	hidden: '\x1b[8m',
	strikethrough: '\x1b[9m',
};

/**
 * Some hard-coded colour code themes I like
 *
 * A colour theme must conform to the ColourTheme type:
 * - misc: <reset, bold, dim, underscore, blink, reverse, hidden, strikethrough>
 * - colours: <black, white, grey, lightGrey, red, orange, yellow, green, cyan, blue, pink, purple>
 */
const colourThemes = {
	/*
	 * A theme that I like for use in windows terminal
	 * Works pretty nice in VSCode too
	 */
	windowsTerminal: {
		...terminal,
		black: '\x1b[30m',
		white: '\x1b[37m',
		grey: '\x1b[38;2;90;90;90m',
		lightGrey: '\x1b[38;2;110;110;110m',
		red: '\x1b[38;2;217;39;26m',
		orange: '\x1b[38;2;217;144;26m',
		yellow: '\x1b[38;2;209;212;34m',
		green: '\x1b[38;2;36;186;22m',
		blue: '\x1b[34m',
		cyan: '\x1b[36m',
		pink: '\x1b[38;2;189;25;167m',
		purple: '\x1b[38;2;118;25;189m',
	},
	/**
	 * A theme that looks nice with the dehydration theme in Konsole terminal (linux)
	 */
	linuxKonsoleDehydration: {
		...terminal,
		black: '\x1b[30m',
		white: '\x1b[37m',
		grey: '\x1b[0;90m',
		lightGrey: '\x1b[38;2;110;110;110m',
		red: '\x1b[31m',
		orange: '\x1b[38;2;217;144;26m',
		yellow: '\x1b[38;2;209;212;34m',
		green: '\x1b[32m',
		blue: '\x1b[34m',
		cyan: '\x1b[36m',
		pink: '\x1b[35m',
		purple: '\x1b[38;5;134m',
	},
};

type ColourTheme = {
	// misc
	reset: string;
	bold: string;
	dim: string;
	underscore: string;
	blink: string;
	reverse: string;
	hidden: string;
	strikethrough: string;
	// colours
	black: string;
	white: string;
	grey: string;
	lightGrey: string;
	red: string;
	orange: string;
	yellow: string;
	green: string;
	blue: string;
	cyan: string;
	pink: string;
	purple: string;
};

// useful for icons: https://emojipedia.org/search / https://gist.github.com/nicolasdao/8f0220d050f585be1b56cc615ef6c12e
// TODO: make the chunk generator handle ASCI colour codes (as if you have a lot the lines can get chunked incorrectly currently)

type LoggerOptions = {
	/**
	 * Whether to display the filename
	 * from which the log came from
	 *
	 * @default Logger.showFilename - which defaults to false
	 */
	showFilename?: boolean;
	/**
	 * Whether to display the timestamp
	 *
	 * @default Logger.showTimestamp - which defaults to true if in node environment, false in browser environment
	 */
	showTimestamp?: boolean;
	/**
	 * Whether to display the date
	 *
	 * @default Logger.showDate - which defaults to false
	 */
	showDate?: boolean;
	/**
	 * Colour to display the namespace of the logger (ANSI colour code)
	 *
	 * @default Logger.namespaceColour - which defaults to utils.Logger.colourTheme.purple
	 */
	namespaceColour?: string;
	/**
	 * Number of characters to allocate for the namespace of the logger
	 *
	 * @default Logger.namespaceWidth - which defaults to 20
	 */
	namespaceWidth?: number;
	/**
	 * The name of the current process e.g. vite (should be 4 or less characters long).
	 * Will prefix the start of the log with this.
	 *
	 * The recommended use of this (if you can) is pass "LOG_PROCESS_NAME" env var into your process,
	 * and this will be set automatically for all loggers under the process.
	 * @default null
	 */
	processName?: string;
	/**
	 * The desired colour theme to use (disabled on browser). See default usage:
	 * - <processName>: theme.cyan
	 * - <date, timestamp, filename>: theme.grey
	 * - <namespace>: theme.purple
	 * - <INFO log level>: theme.blue
	 * - <GOOD log level>: theme.green
	 * - <WARN log level>: theme.yellow
	 * - <FAIL log level>: theme.red
	 * - <DBUG log level>: theme.orange
	 * @default Logger.colourTheme - which defaults to util.colourThemes.linuxKonsoleDehydration
	 */
	colourTheme?: ColourTheme;
};

type LogLevel = keyof typeof LOG_LEVELS;
type AbbrLogLevel = (typeof LOG_LEVELS)[LogLevel];

const LOG_LEVELS = {
	info: 'info',
	good: 'good',
	warn: 'warn',
	error: 'fail',
	debug: 'dbug',
} as const;

const LOG_LEVELS_META = {
	info: {
		emoji: '⚓',
		colour: 'blue',
	},
	good: {
		emoji: '✅',
		colour: 'green',
	},
	warn: {
		emoji: '🔔',
		emojiWidth: 2,
		colour: 'yellow',
	},
	error: {
		emoji: '⛔',
		colour: 'red',
	},
	debug: {
		emoji: '⚡',
		colour: 'orange',
	},
};

/**
 * Browser & Server compatible logger with cool features:
 * - useful meta info
 * - different log levels (INFO, GOOD, WARN, ERROR, DEBUG) w/ corresponding emojis
 * - namespacing/scoping
 * - terminal padding
 * - error formatting
 * - enabling only one or a subset of log levels (LOG_LEVELS env var)
 * - enabling only one or a subset of namespaces (LOG_NAMESPACES env var)
 */
export class Logger {
	/**
	 * The namespace/prefix of the logger
	 */
	public namespace: string;

	public options: Required<LoggerOptions>;

	public static colourTheme = colourThemes.linuxKonsoleDehydration;
	public static showFilename = false;
	public static showTimestamp = true;
	public static showDate = false;
	public static namespaceColour = Logger.colourTheme.purple;
	public static namespaceWidth = 20;

	private disableLogging = false;
	private enabledLogLevels: Set<AbbrLogLevel> = new Set();

	constructor(namespace: string, options: LoggerOptions = {}) {
		if (!namespace) {
			throw new Error('You must provide a namespace to the logger');
		}

		const defaultOptions = {
			showFilename: Logger.showFilename,
			showTimestamp: Logger.showTimestamp,
			showDate: Logger.showDate,
			namespaceColour: Logger.namespaceColour,
			namespaceWidth: Logger.namespaceWidth,
			colourTheme: Logger.colourTheme,
			processName: process.env.LOG_PROCESS_NAME?.trim() ?? null,
		};

		this.namespace = namespace;
		this.options = Object.assign({}, defaultOptions, options);

		if (options.colourTheme) {
			this.options.namespaceColour = options.colourTheme.purple;
		}

		const logLevelsVar = process.env.LOG_LEVELS;
		const logNamespacesVar = process.env.LOG_NAMESPACES;

		if (logLevelsVar) {
			const logLevelsParsed = parseEnvVarList(logLevelsVar) as AbbrLogLevel[];
			for (const type of logLevelsParsed) {
				const [keys, values] = Object.entries(LOG_LEVELS);

				if (keys.includes(type)) {
					this.enabledLogLevels.add(LOG_LEVELS[type]);
				} else if (values.includes(type)) {
					this.enabledLogLevels.add(type);
				}
			}
		}

		if (logNamespacesVar) {
			const namespacesParsed = parseEnvVarList(logNamespacesVar);
			this.disableLogging = !namespacesParsed.includes(namespace);
		}
	}

	/**
	 * Logs an INFO message
	 */
	public info(...messages: any[]) {
		this._log('info', ...messages);
	}

	/**
	 * Logs a GOOD message
	 */
	public good(...messages: any[]) {
		this._log('good', ...messages);
	}

	/**
	 * Logs a WARN message
	 */
	public warn(...messages: any[]) {
		this._log('warn', ...messages);
	}

	/**
	 * Logs a FAIL message
	 */
	public error(...messages: any[]) {
		this._log('error', ...messages);
	}

	/**
	 * Logs a DEBUG message
	 *
	 * Only shows with LOG_DEBUG=1 env var
	 */
	public debug(...messages: any[]) {
		const logDebug = process.env.LOG_DEBUG !== null;
		if (logDebug) {
			this._log('debug', ...messages);
		}
	}

	/**
	 * Logs a message to console
	 *
	 * @param logLevel: the log level
	 * @param messages: the messages to log
	 *
	 * @format - [date timestamp] [filename] [icon] [level]: msg
	 */
	private _log(logLevel: LogLevel, ...messages: any[]) {
		const { emoji, colour, emojiWidth } = LOG_LEVELS_META[logLevel];
		const type = LOG_LEVELS[logLevel];

		if ((this.enabledLogLevels.size && !this.enabledLogLevels.has(type)) || this.disableLogging) {
			return;
		}

		messages = messages.map((msg) => {
			if (msg instanceof Error) {
				const stack = msg.stack;
				if (stack) {
					return formatErrStack(stack, this.options.colourTheme);
				}
				return msg.message;
			} else {
				return msg;
			}
		});

		const meta = this.generateMeta({ emoji, colour, type });
		const emojiOffset = (emojiWidth ?? 1) - 1;
		// +1 because of extra space the console will add automatically
		const metaLength = getRawString(meta).length + 1 - emojiOffset;
		const msgs = this.generateMessages(messages, metaLength);

		const logFn = getLogFn(type);
		console[logFn](meta, ...msgs, this.options.colourTheme.reset);
	}

	/**
	 * Process and return what user wants to log
	 * In dev messages will be padded so they align nicely
	 */
	private generateMessages(messages: any[], metaLength: number) {
		if (process.stdout.columns === undefined || !dev) {
			return messages;
		}

		// this is the available characters after the Loggers meta info
		const availableSpace = process.stdout.columns - metaLength;
		const leftPad = ' '.repeat(metaLength);

		/**
		 * A chunk is essentially one line in the terminal
		 *
		 * Need to split up the msg to add padding so things align nice
		 */
		const splitIntoChunks = (msg: string, padStart?: boolean) => {
			// because of zero based indexing
			const _availableSpace = availableSpace - 1;
			const msgChunks: any[] = [];

			let i = 0;
			for (i; i < msg.length + _availableSpace;) {
				const addLeftPad = padStart || i !== 0;
				let chunk = msg.substring(i, i + _availableSpace);

				if (!chunk) {
					break;
				}

				const nlIndex = findFirstNlIndex(chunk);
				if (nlIndex !== null) {
					chunk = chunk.substring(0, nlIndex + 1);
				}

				chunk = `${addLeftPad ? leftPad : ''}${chunk}`;
				msgChunks.push(chunk);
				i += nlIndex !== null ? nlIndex + 1 : _availableSpace - 1;
			}

			return msgChunks;
		};

		const chunks: any[] = [];

		for (let i = 0; i < messages.length; i++) {
			let msg = messages[i];
			const prevMsg = messages[i - 1];

			if (typeof msg === 'string') {
				const padStart = typeof prevMsg === 'string' && prevMsg.at(-1) === '\n';
				const msgChunks = splitIntoChunks(msg, padStart);
				chunks.push(...msgChunks);
			} else {
				chunks.push(msg);
			}
		}

		return chunks;
	}

	/**
	 * Generates meta info msg (time, namespace etc...)
	 */
	private generateMeta(meta: { emoji: string; colour: string; type: AbbrLogLevel }) {
		const { showDate, showTimestamp, showFilename, namespaceColour, colourTheme } = this.options;
		const { emoji, colour, type } = meta;

		const showBeginningMeta = showDate || showTimestamp || showFilename;
		let msg = '';

		// Process name
		if (this.options.processName) {
			msg += colourTheme.cyan + '[' + padString(this.options.processName, 4) + ']' + ' ';
		}

		if (showBeginningMeta) {
			msg += colourTheme.grey + '<';
		}
		if (showDate) {
			const date = new Date().toLocaleDateString('en-GB');
			msg += date;
		}
		if (showTimestamp) {
			const time = new Date().toLocaleTimeString();
			msg += showDate ? ' ' : '';
			msg += time;
		}
		if (showFilename) {
			const file = import.meta.url.split('/').at(-1) ?? './';
			msg += showTimestamp ? ' ' : '';
			msg += padString(file, 9);
		}
		if (showBeginningMeta) {
			msg += colourTheme.grey + '>' + ' ';
		}

		// log type icon + text
		msg += emoji + ' ';
		msg += colourTheme[colour] + colourTheme.bold + type.toUpperCase() + colourTheme.reset;

		// namespace
		msg += ' ' + namespaceColour + padString(this.namespace, this.options.namespaceWidth) + ' ';

		// separator
		msg += colourTheme.grey + '>>' + colourTheme.reset;

		return msg;
	}
}

/**
 * Creates a logger
 *
 * @param namespace: recommended format is projectNameAbbreviated:descriptor (e.g. nw:logger, nw:http, nw:socket)
 */
export function logger(namespace: string, opts?: LoggerOptions) {
	return new Logger(namespace, opts);
}

function parseEnvVarList(txt: string) {
	return txt.replaceAll(' ', '').replaceAll('"', '').replaceAll("'", '').split(',');
}

function getLogFn(type: AbbrLogLevel) {
	return {
		info: 'info',
		good: 'log',
		warn: 'warn',
		fail: 'error',
		dbug: 'debug',
	}[type];
}

function findFirstNlIndex(msg: string) {
	for (let i = 0; i < msg.length; i++) {
		const char = msg[i];
		if (char === '\n') {
			return i;
		}
	}
	return null;
}

function getRawString(txt: string) {
	return txt.replaceAll(/(\x9B|\x1B\[)[0-?]*[ -\/]*[@-~]/gi, '');
}

function padString(msg: string, length: number) {
	msg = msg.trim();
	let paddedMsg = msg.padEnd(length, ' ');
	if (msg.length > length) {
		paddedMsg = paddedMsg.substring(0, length - 3) + '...';
	}
	return paddedMsg;
}

function formatErrStack(stack: string, colourTheme: ColourTheme) {
	const lines = stack.split('\n');

	for (let i = 0; i < lines.length; i++) {
		let line = lines[i];
		if (line.startsWith('    at')) {
			// stack indents by 4
			line = line.substring(4);

			const split = line.split(' ');
			let at = split.at(0);
			let fn = split.slice(1, -1).join(' ');
			let loc = split.at(-1);

			const cwd = process.cwd().toLowerCase().replaceAll('\\', '/');
			const _loc = loc?.toLowerCase().replaceAll('\\', '/') as string;
			const locSplit = _loc.split(cwd);

			if (locSplit.length === 1) {
				loc = locSplit[0];
			} else {
				if (locSplit[1].startsWith('/')) {
					locSplit[1] = '.' + locSplit[1];
				}
				loc = locSplit.join('');
			}

			at = colourTheme.lightGrey + at;

			lines[i] = lines[i].substring(0, 4) + at + ' ' + fn + ' ' + loc;
		} else {
			lines[i] = colourTheme.red + lines[i];
		}
	}

	lines[lines.length - 1] = lines[lines.length - 1] + colourTheme.reset;
	return lines.join('\n');
}
