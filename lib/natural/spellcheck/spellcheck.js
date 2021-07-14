/*
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

'use strict'

const BKTree = require('../bktree/bktree')
const levenshtein = require('../distance/levenshtein_distance')
const _ = require('underscore')

// wordlist is a corpus (an array) from which word probabilities are calculated (so something like /usr/share/dict/words (on OSX) will work okay, but real world text will work better)
function Spellcheck(wordlist, distanceMetric) {
  wordlist = _.shuffle(wordlist) // shuffle for better distribution
  this.set = new Set(wordlist)
  this.bktree = new BKTree(wordlist, distanceMetric || levenshtein.DamerauLevenshteinDistance)
  this.word2frequency = buildWord2Frequency(wordlist)
}

Spellcheck.prototype.isCorrect = function (word) {
  return this.set.has(word)
}

function buildWord2Frequency(wordlist) {
  const w2f = new Map();
  for (let i in wordlist) {
    const word = wordlist[i]
    if (w2f.has(word)) {
      w2f.set(word, w2f.get(word) + 1)
    } else {
      w2f.set(word, 1)
    }
  }
  return w2f;
}

// Returns a list of suggested corrections, from highest to lowest probability
// maxDistance is the maximum edit distance
Spellcheck.prototype.getCorrections = function (word, maxDistance) {
  if (!maxDistance) maxDistance = 1
  return this.bktree.find(word, maxDistance)
    .sort((a, b) => {
      // the word itself should always come first
      if (a === word) return -1
      if (b === word) return 1
      
      return this.word2frequency.get(b) - this.word2frequency.get(a)
    })
}

// Returns all edits that are 1 edit-distance away from the input word
Spellcheck.prototype.edits = function (word) {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz'
  let edits = []
  for (let i = 0; i < word.length + 1; i++) {
    if (i > 0) edits.push(word.slice(0, i - 1) + word.slice(i, word.length)) // deletes
    if (i > 0 && i < word.length + 1) edits.push(word.slice(0, i - 1) + word.slice(i, i + 1) + word.slice(i - 1, i) + word.slice(i + 1, word.length)) // transposes
    for (let k = 0; k < alphabet.length; k++) {
      if (i > 0) edits.push(word.slice(0, i - 1) + alphabet[k] + word.slice(i, word.length)) // replaces
      edits.push(word.slice(0, i) + alphabet[k] + word.slice(i, word.length)) // inserts
    }
  }
  // Deduplicate edits
  edits = edits.filter(function (v, i, a) { return a.indexOf(v) === i })
  return edits
}

// Returns all edits that are up to "distance" edit distance away from the input word
Spellcheck.prototype.editsWithMaxDistance = function (word, distance) {
  return this.editsWithMaxDistanceHelper(distance, [[word]])
}

Spellcheck.prototype.editsWithMaxDistanceHelper = function (distanceCounter, distance2edits) {
  if (distanceCounter === 0) return distance2edits
  const currentDepth = distance2edits.length - 1
  const words = distance2edits[currentDepth]
  // const edits = this.edits(words[0])
  distance2edits[currentDepth + 1] = []
  for (const i in words) {
    distance2edits[currentDepth + 1] = distance2edits[currentDepth + 1].concat(this.edits(words[i]))
  }
  return this.editsWithMaxDistanceHelper(distanceCounter - 1, distance2edits)
}

module.exports = Spellcheck
