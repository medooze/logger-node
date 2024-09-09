//@ts-nocheck
process.env["DEBUG"]="";
const util = require("util");
const tty = require("tty");

//Ruse same date object to reduce object allocations
const date = new Date();

const Colors = [
//"\u001b[30;1m", Black
	"\u001b[31;1m",
	"\u001b[32;1m",
	"\u001b[33;1m",
	"\u001b[34;1m",
	"\u001b[35;1m",
	"\u001b[36;1m",
//"\u001b[37;1m", White
];



const options = {};
let FlushTimeout = 100;
let writable, colors, timer;

function log(color, prefix, message, args)
{
	//Update time
	date.setTime(Date.now());
	
	//We don't want to flush the logs each time this function is called
	if (FlushTimeout && !timer)
	{
		//Write logs each 100ms
		timer = setTimeout(()=>{
			writable.uncork();		
			timer = null;
		}, FlushTimeout);
		//Buffer log
		writable.cork();
	}

	if (colors)
		writable.write(color);

	writable.write(date.toISOString());
	writable.write(prefix);
	writable.write(util.formatWithOptions(options,message,...args));

	if (colors)
		writable.write("\n\u001b[0m");
	else
		writable.write("\n");
	
}

class Logger
{
	/**
	 * Creates a new logger instance
	 * 
	 * @param {string} name     - A name identifying the sub-catcgeory of this logger, for example if we are logging for a specific view stream id
	 * @param {string} category - Identifier or subsystem this logger services, for example "publisher", "media-server", "audio-codecs" etc
	 */
	constructor(name, category)
	{
		const categoryText = category ? "[" + category + "]" : "";
		this.category = category;
		this.name = name;
		this.color = Colors[Math.trunc(Math.random()*Colors.length)];
		this.prefixInfo  = " [INFO ] " + categoryText + this.name + " ";
		this.prefixDebug = " [DEBUG] " + categoryText + this.name + " ";
		this.prefixWarn  = " [WARN ] " + categoryText + this.name + " ";
		this.prefixError = " [ERROR] " + categoryText + this.name + " ";
	}

	info(message, ...args)
	{
		log(this.color, this.prefixInfo, message, args);
	}

	debug(message, ...args)
	{
		log(this.color, this.prefixDebug, message, args);
	}

	warn(message, ...args)
	{
		log(this.color, this.prefixWarn,  message, args);
	}

	error(message, ...args)
	{
		log(this.color, this.prefixError,  message, args);
	}
	
	child(name)
	{
		return new Logger(this.name +":"+name, this.category);
	}

	getName()
	{
		return this.name;
	}
}

Logger.setWritableStream = function(stream)
{
	writable = stream;
	if (tty.isatty(writable.fd))
	{
		options.colors = colors = true;
	} else {
		options.compact = true;
		options.breakLength = Infinity;
		Error.prepareStackTrace = (err, stack) => JSON.stringify({
			message: err.message,
			stack: stack.map(frame => `${frame.getFunctionName()}(${frame.getFileName()}:${frame.getLineNumber()}):${frame.getColumnNumber()}`)
		});
	}
	
};

//Log to stderr by default
Logger.setWritableStream(process.stderr);

Logger.setFlushTimeout = function(timeout)
{
	FlushTimeout = timeout;
};

Logger.end = function()
{
	// We cant call writable.end() here to properly end and flush
	// As there are still async ops outstanding sometimes that will
	// throw exceptions.
	//
	// Instead we will force uncork from now on so they flush out regulary

	// Prevent ongoing batching
	FlushTimeout = 0;
	if (timer)
	{
		clearTimeout(timer);
		writable.uncork();
		timer = null;
	}
};

module.exports = Logger;

