// The module 'vscode' contains the VS Code extensibility API

//const spellchecker = require("./spellchecker")
// Import the module and reference it with the alias vscode in your code below
const fs = require("fs")
const vscode = require('vscode');
const spellchecker = require("./spellchecker")
const spell = require('spell-checker-js')
const path = require('path')
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed


/**
 * IDEA - 
 * 	List of comments
 * 	spell check commets returns mispelt and sugessions 
 *  search for mispelt 
 * 
 */
/**
 * @param {vscode.ExtensionContext} context
 */

let decorationType = null;
function activate(context) {	
    
	let disposable = vscode.commands.registerCommand('comment-spell-checker-extension.checkspell', function () {
        const editor = vscode.window.activeTextEditor;
		const document = editor.document;	
		const languageID = document.languageId;
        const content = document.getText();
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user`	
		comment_Val_Pos= read_comments(content, document, languageID)
        wordsToCheck = misspelt_words(comment_Val_Pos)
        word_ranges = get_misspelt_word_range(comment_Val_Pos[0], comment_Val_Pos[1], wordsToCheck,document)
        corrections = spellcheck_corrections(wordsToCheck)
        if (decorationType){
            decorationType.dispose()
        } 

        decorationType = highlight_comments(editor,word_ranges)

        const hoverProvider = vscode.languages.registerHoverProvider(languageID, {
        provideHover(document, position, token) {
            const hoverText = new vscode.MarkdownString();
            for(let range of word_ranges){
                if(range.contains(position)){ 
                    word = document.getText(range)
                    correction = corrections[word] 
                    hoverText.appendMarkdown(correction)
                }
                else{
                    hoverText.appendMarkdown("")
                }
            } 
            return new vscode.Hover(hoverText);
            }
        });
       
        context.subscriptions.push(hoverProvider)
	});

	context.subscriptions.push(disposable);
}
function misspelt_words(comment_Val_Pos){
    let allwords = "" 
    spell.load('en')
    comments = comment_Val_Pos[0]

    comments.forEach(words =>{
        allwords += words
    })
    let wordsToCheck = spell.check(allwords)
    return wordsToCheck
}

function get_misspelt_word_range(comments,ranges, wordsToCheck, document){

    let words_ranges = []
    

    for (let i = 0; i < comments.length; i++){
        wordsToCheck.forEach(word => {
            if (comments[i].includes(word)){
                offset = comments[i].search(word)
                offset_start = document.offsetAt(ranges[i].start) + offset
                offset_end = offset_start + word.length
                position_start = document.positionAt(offset_start)
                position_end = document.positionAt(offset_end) 
                range = new vscode.Range(position_start, position_end);
                words_ranges.push(range)
            }
        })

    }
    return words_ranges


}

function spellcheck_corrections(wordsToCheck){
    spell.load('en')
    var speller = spellchecker.NorvigSpellChecker();
    speller.train(get_train_file())
    let corrections = speller.correct(...wordsToCheck)
    return corrections
}

function get_train_file(){
    const filePath = path.join(__dirname, 'big.txt');
    const allFileContents = fs.readFileSync(filePath,'utf8');
    return allFileContents
}

function read_comments(content , document, languageID){
	let commentPatterns = {
        'javascript': [/\/\/.*$/gm, /\/\*[\s\S]*?\*\//gm],
        'typescript': [/\/\/.*$/gm, /\/\*[\s\S]*?\*\//gm],
        'python': [/#.*$/gm, /""".*?"""/gs, /'''.*?'''/gs],
        'java': [/\/\/.*$/gm, /\/\*[\s\S]*?\*\//gm],
        'c': [/\/\/.*$/gm, /\/\*[\s\S]*?\*\//gm],
        'cpp': [/\/\/.*$/gm, /\/\*[\s\S]*?\*\//gm],
        // Add more languages and their comment patterns here
    };
    let patterns = commentPatterns[languageID] || [];
    let commentRanges = []
	let comments = []
	patterns.forEach(pattern => {
        let match;
        // Find all matches for the current pattern
        while ((match = pattern.exec(content)) !== null) {
			comments.push(match[0])
            const startPos = document.positionAt(match.index);
            const endPos = document.positionAt(match.index + match[0].length);
            const range = new vscode.Range(startPos, endPos);
            commentRanges.push(range);
        }
    });
	return [comments, commentRanges]

}

function highlight_comments(editor, ranges,decorationType) { 
        decorationType = vscode.window.createTextEditorDecorationType({
          backgroundColor: 'rgba(250,250 , 0 , 0.2)'
        });
    

    editor.setDecorations(decorationType , ranges);
    return decorationType
}




// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
