function find(rats) {
    rats.sort((a, b) => a - b);
    
    let str = "0000000000".split("");
    for (let i = 0; i < rats.length; i++) {
        str[rats[i]] = "1";
    }
    str = str.reverse().join("");
    return parseInt(str, 2);
}

describe("find", function() { 
    it("basic tests", function() { 
    Test.assertEquals(find([1]), 2); 
    Test.assertEquals(find([0, 1, 2]), 7); 
    Test.assertEquals(find([3, 5, 6, 7, 8, 9]), 1000); 
    Test.assertEquals(find([0, 3, 5, 4, 9, 8]), 825); 
    Test.assertEquals(find([0, 1, 9, 3, 5]), 555); 
    Test.assertEquals(find([0, 1, 2, 3, 4, 6]), 95); 
    Test.assertEquals(find([0, 1, 3, 4]), 27); 
    }); 
}); 
