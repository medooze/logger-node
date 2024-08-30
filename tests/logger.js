const tap = require("tap");
const Logger = require("../index");

class MockWritableStream
{
	constructor() 
	{
		this.messages = "";
	}

	write(msg) 
	{
		this.messages += msg;
	}
	cork() {}
	uncork() {}
}

function testContains(test, stream, pattern)
{
	if (!stream.messages.includes(pattern))
	{
		test.equal(stream.messages, pattern);
	}
	else
	{
		test.ok(true);
	}
	stream.messages = "";
}

tap.test("logging", async suite => {

	// Validates the setWritableStream API and means we can check results in tests
	const stream = new MockWritableStream();
	Logger.setWritableStream(stream);

	suite.test("basic", async test => {
		const logger = new Logger("Test");
		logger.error("error message");
		testContains(test, stream, "[ERROR] Test error message");

		logger.warn("warn message");
		testContains(test, stream, "[WARN ] Test warn message");

		logger.info("info message");
		testContains(test, stream, "[INFO ] Test info message");

		logger.debug("debug message");
		testContains(test, stream, "[DEBUG] Test debug message");

		test.equal(logger.getName(), "Test");

		const child = logger.child("child");
		child.error("error message");
		testContains(test, stream, "[ERROR] Test:child error message");
	});

	suite.test("custom-single-line-exception-stack-trace", async test => {
		
		const logger = new Logger("Test");
		try
		{
			throw new Error("hello world");
		}
		catch (e)
		{
			logger.error(e);
		}
	});

	suite.test("api-setFlushTimeout", async test => {
		Logger.setFlushTimeout(1000);
		const logger = new Logger("Test");
		logger.debug("debug message");
	});
});
