/*
Copyright (C) 2010 by Henrik Hinrichs

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

var fs = require("fs");

// Word file lines can look like this

// WORD definition with spaces [type ENDINGS] : WORDLINK [type]
// WORD definition with spaces [type] : WORDLINK [type]
// WORD definition with spaces [type]
// WORD [type]
// WORD

// description can contain
// <linkname=type>   > link to that definition
// {linkname=type}   > include that definitions text

var wordFile = "example.txt";


var isWord = function(wordTree, letters) {
    var root = wordTree;
    for (var ii = 0, ll = letters.length; ii < ll; ii++) {
        var character = letters[ii];
        
        if (!root[character]) {
            return false;
        }
        
        root = root[character];
    }
    
    if (!root.$) {
        return false;
    }
    
    return root;
};


var createWordTree = function(wordList) {
    // Generate the word tree
    console.log("parsing wordlist", startTimer("parse"));
    var matcher = /^([a-zA-Z]+)\s{0,1}(?:(.+?)\s){0,1}(\[.+){0,1}$/;
    var wordTree = {};

    var lines = wordList.split("\n");
    var words = 0, line, match, letters, root, c;
    while (lines.length > 0) {
        line = lines.pop();
        
        match = line.match(matcher);
        if (match) {            
            root = wordTree;
            letters = match[1];
            letters = letters.replace(/\s/gm, "");
            letters = letters.toUpperCase();
            
            for (var ii = 0, ll = letters.length; ii < ll; ii++) {
                c = letters[ii];
                
                if (!root[c]) {
                    root[c] = {};
                }
                root = root[c];
            
                if (ii === ll-1) {
                    words++;
                    root.$ = 1;
                    // store description in tree
                    //root.$d = match[2];
                }
            }
        }
    }
    console.log("...done (", words, "words ) (", endTimer("parse"), "ms )");
    
    // speed test
    startTimer("find");
    for (var i = 0; i < 100000; i++) {
        isWord(wordTree, "NEUROANATOMICAL");
    }    
    console.log("...done checking (", endTimer("find"), "ms )");
    
    // persisting
    startTimer("create json");
    var json = JSON.stringify(wordTree);    
    console.log("...done creating json (", json.length, "bytes ) (", endTimer("create json"), "ms )");  
    wordTree = null;

    startTimer("parse json");
    var tree = JSON.parse(json);    
    console.log("...done parsing json (", endTimer("parse json"), "ms )");  
    console.log(isWord(tree, "NEUROANATOMICAL") != false ? "JSON Works" : "JSON Fails");
    
    startTimer("write json");
    fs.writeFileSync(__dirname + "/wordfile.json", json);
    console.log("...done writing json (", json.length, "bytes ) (", endTimer("write json"), "ms )");  
    
    var js = "tree = " + json.replace(/"(.)":/g, "$1:") + ";";
    startTimer("write js");
    fs.writeFileSync(__dirname + "/wordfile.js", js);
    console.log("...done writing js (", js.length, "bytes ) (", endTimer("write js"), "ms )");  
    json = null; tree = null;
       
    startTimer("read js");
    eval(js);
    console.log("...done parsing js (", endTimer("read js"), "ms )");    
    console.log(isWord(tree, "NEUROANATOMICAL") != false ? "JS Works" : "JS Fails");
    js = null;
};


var timers = {};
var startTimer = function(name) {
    timers[name] = (new Date()).getTime();
    return "";
};
var endTimer = function(name) {
    var elapsed = (new Date()).getTime() - timers[name];
    delete timers[name];
    return elapsed;
};


console.log("reading word list file " + wordFile, startTimer("read"));
fs.readFile(__dirname + "/" + wordFile, function (err, data) {
  if (err) throw err;
  
  console.log("...done (", endTimer("read"), "ms )");
  createWordTree(data.toString());
});


