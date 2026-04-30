const assert = require("assert");

global.Test = {
    assertEquals(actual, expected) {
        assert.strictEqual(actual, expected);
    },
};
