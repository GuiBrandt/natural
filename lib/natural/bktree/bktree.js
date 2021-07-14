/*
Copyright (c) 2021 Guilherme Brandt

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

/**
 * Burkhard-Keller tree class.
 */
function BKTree(wordlist, metric) {
    this.children = []
    this.$ = null
    this.metric = metric
    if (wordlist !== undefined) wordlist.forEach(word => this.add(word))
}

/**
 * Adds a word to the dictionary if it doesn't exist, returns true if the word was already in the
 * dictionary.
 */
BKTree.prototype.add = function(word) {
    if (this.$ === null) {
        this.$ = word
        return false
    }
    
    const distance = this.metric(this.$, word)
    
    if (distance === 0) return true
    
    if (this.children[distance - 1] === undefined) {
        this.children[distance - 1] = new BKTree([word], this.metric)
        return false
    }
    
    this.children[distance - 1].add(word)
    return false
}

/**
 * Searches for words that have a maximum distance <maxDistance> from a given word <word> in the tree's metric.
 */
BKTree.prototype.find = function(word, maxDistance) {
    if (this.$ === null) return []

    const words = []
    const distance = this.metric(this.$, word)
    
    if (distance <= maxDistance) words.push(this.$)
    
    // This is the core concept behind the BK-Tree: we only need to look at the children where
    // |distance(this, child) - distance(this, word)| <= maxDistance.
    for (let i = Math.max(1, distance - maxDistance); i <= distance + maxDistance && i <= this.children.length; i++) {
        const child = this.children[i - 1]
        
        if (child === undefined) continue
        
        words.push.apply(words, child.find(word, maxDistance))
    }
    
    return words
}

module.exports = BKTree
