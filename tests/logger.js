const tap = require("tap");
const Logger = require("../index");

class NullWritableStream
{
	constructor() { }

	write() {}
	cork() {}
	uncork() {}
}

tap.test("logging", async suite => {

	suite.test("basic", async test => {
		const logger = new Logger("Test");
		logger.error("error message");
		logger.warn("warn message");
		logger.info("info message");
		logger.debug("debug message");
		test.equal(logger.getName(), "Test");

		const child = logger.child("child");
		child.error("error message");
		child.warn("warn message");
		child.info("info message");
		child.debug("debug message");
		test.equal(child.getName(), "Test:child");
	});

	suite.test("api-setFlushTimeout", async test => {
		Logger.setFlushTimeout(1000);
		const logger = new Logger("Test");
		logger.debug("debug message");
	});

	suite.test("api-setWritableStream", async test => {
		Logger.setWritableStream(new NullWritableStream());
		const logger = new Logger("Test");
		logger.debug("debug message");
	});
});
