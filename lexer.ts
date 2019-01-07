
export enum TTokenType {
    EOF,
    PLUS,
    MINUS,
    MULTIPLY,
    DIVIDE,
    PERIOD,
    BACKSLASH,
    COLON,
    PERCENT,
    PIPE,
    EXCLAMATION,
    QUESTION,
    POUND,
    AMPERSAND,
    SEMI,
    COMMA,
    L_PAREN,
    R_PAREN,
    LT,
    GT,
    LTE,
    GTE,
    L_BRACE,
    R_BRACE,
    L_BRACKET,
	R_BRACKET,
	AFFECT,
    EQUALS,
    NOTEQUALS,
    QUOTE,
    COMMENT,
	NUMBER,
    IDENTIFIER,
	I_AND,
	I_OR,
	I_NOT,
	I_IF
};

export type TToken= {
    type: TTokenType,
    value: string,
	pos: number
};

type TTokens= { [op:string]: TTokenType };

class LexerError extends Error {};

export class Lexer {
  private pos = 0;
  private buf: any = null;
  private buflen = 0;
  private curToken: TToken= {type: TTokenType.EOF, value: '', pos: 0};
  private codeObj: Array<TToken>= [];
  private curTokIdx: number= 0;
  private tokCount: number= 0;

  // Operator table, mapping operator -> token name
  private optable: TTokens = {
    '+':  TTokenType.PLUS,
    '-':  TTokenType.MINUS,
    '*':  TTokenType.MULTIPLY,
    '/':  -TTokenType.DIVIDE,
    '.':  TTokenType.PERIOD,
    '\\': TTokenType.BACKSLASH,
    ':':  -TTokenType.COLON,
    '%':  TTokenType.PERCENT,
    '|':  TTokenType.PIPE,
    '!':  -TTokenType.EXCLAMATION,
    '?':  TTokenType.QUESTION,
    '#':  TTokenType.POUND,
    '&':  TTokenType.AMPERSAND,
    ';':  TTokenType.SEMI,
    ',':  TTokenType.COMMA,
    '(':  TTokenType.L_PAREN,
    ')':  TTokenType.R_PAREN,
    '<':  -TTokenType.LT,
    '>':  -TTokenType.GT,
    '{':  TTokenType.L_BRACE,
    '}':  TTokenType.R_BRACE,
    '[':  TTokenType.L_BRACKET,
    ']':  TTokenType.R_BRACKET,
    '=':  TTokenType.EQUALS
  };
  private optable2: any = {
    '!=':  TTokenType.NOTEQUALS,
    '<>':  TTokenType.NOTEQUALS,
    '<=':  TTokenType.LTE,
    '>=':  TTokenType.GTE,
    ':=':  TTokenType.AFFECT,
	'//': 	() => this._process_comment()
  };

    constructor(src?: string) {
        this.input(src ? src : '');
    }

    // Initialize the Lexer's buffer. This resets the lexer's internal
    // state and subsequent tokens will be returned starting with the
    // beginning of the new buffer.
    input(buf: string) {
        this.pos = 0;
        this.buf = buf;
        this.buflen = buf.length;
    }

    tokenize(): void {
        this.pos = 0;
        while(this.advance()) {
            this.codeObj.push(this.curToken);
        }
        this.curTokIdx= 0;
        this.tokCount= this.codeObj.length;
console.log('tokenize',this.codeObj);
    }

    lookahead(): TToken {
        if(this.curTokIdx >= this.tokCount-1)
            return {type: TTokenType.EOF, value: '', pos: this.tokCount};

//console.log(`lookahead(${this.curTokIdx+1})`,this.codeObj[this.curTokIdx+1]);

        return this.codeObj[this.curTokIdx + 1];
    }

    isLookahead(type: TTokenType): boolean {
        if(this.curTokIdx >= this.tokCount-1)
            return false;

//console.log(`isLookahead(${this.curTokIdx+1})`, TTokenType[type], this.codeObj[this.curTokIdx+1]);

        return this.codeObj[this.curTokIdx + 1].type == type;
    }

    token(): TToken {
        if(this.curTokIdx >= this.tokCount)
            return {type: TTokenType.EOF, value: '', pos: this.tokCount};

//console.log(`token(${this.curTokIdx})`,this.codeObj[this.curTokIdx]);

        return this.codeObj[this.curTokIdx];
    }

    isToken(type: TTokenType): boolean {

//console.log(`isToken(${this.curTokIdx})`, TTokenType[type], this.codeObj[this.curTokIdx]);

        return this.curTokIdx < this.tokCount ? this.codeObj[this.curTokIdx].type == type : false;
    }

    next(): boolean {
        this.curTokIdx++;
        return this.curTokIdx < this.tokCount;
    }

    eof(): boolean {
        return this.curTokIdx >= this.tokCount;
    }

    // Get the next token from the current buffer. A token is an object with
    // the following properties:
    // - name: name of the pattern that this token matched (taken from rules).
    // - value: actual string value of the token.
    // - pos: offset in the current buffer where the token starts.
    //
    // If there are no more tokens in the buffer, returns null. In case of
    // an error throws Error.
    private advance(): boolean {
		let c: string,
			op: any,
			op2: any,
			next_c: string;

        this._skipnontokens();
        if (this.pos >= this.buflen) {
            this.curToken= {type: TTokenType.EOF, value: '', pos: this.pos};
            return false;
        }

        // The char at this.pos is part of a real token. Figure out which.
        c= this.buf.charAt(this.pos);
/*
        // '/' is treated specially, because it starts a comment if followed by
        // another '/'. If not followed by another '/', it's the DIVIDE
        // operator.
        if (c === '/') {
            var next_c = this.buf.charAt(this.pos + 1);
            if (next_c === '/') {
                return this._process_comment();
            } else {
                this.curToken= {type: TTokenType.DIVIDE, value: '/', pos: this.pos++};
                return true;
            }
        } else {
*/			
            // Look it up in the table of operators
            op= this.optable[c];
            if(op !== undefined) {
				if(op<0) {
					next_c = this.buf.charAt(this.pos + 1);
					op2= this.optable2[c+next_c];
					if(op2 !== undefined) {
						if(typeof op2 == "function")
							return (<Function>op2).apply(this);
						this.curToken= {type: op2, value: c+next_c, pos: (this.pos,this.pos+=2)};
						return true;
					}
					op= -op;
				}

               	this.curToken= {type: op, value: c, pos: this.pos++};
                return true;
            } else {
				// Not an operator - so it's the beginning of another token.
				if (Lexer._isalpha(c)) {
					return this._process_identifier();
				} else if (Lexer._isdigit(c)) {
					return this._process_number();
				} else if (c=='"' || c=="'") {
					return this._process_quote(c);
				} else {
					throw new LexerError('Token error at ' + this.pos);
				}
            }
//        }
    }

    static _isnewline(c: string): boolean {
        return c === '\r' || c === '\n';
    }

    static _isdigit(c: string): boolean {
        return c >= '0' && c <= '9';
    }

    static _isalpha(c: string): boolean {
        return (c >= 'a' && c <= 'z') ||
                (c >= 'A' && c <= 'Z') ||
                c === '_' || c === '$';
    }

    static _isalphanum(c: string): boolean {
        return (c >= 'a' && c <= 'z') ||
                (c >= 'A' && c <= 'Z') ||
                (c >= '0' && c <= '9') ||
                c === '_' || c === '$';
    }

    _process_number(): boolean {
        var endpos = this.pos + 1;
        while (endpos < this.buflen &&
                Lexer._isdigit(this.buf.charAt(endpos))) {
            endpos++;
        }

        this.curToken = {
            type: TTokenType.NUMBER,
            value: this.buf.substring(this.pos, endpos),
            pos: this.pos
        };
        this.pos = endpos;
        return true;
    }

    _process_comment(): boolean {
        var endpos = this.pos + 2;
        // Skip until the end of the line
        var c = this.buf.charAt(this.pos + 2);
        while (endpos < this.buflen &&
                !Lexer._isnewline(this.buf.charAt(endpos))) {
            endpos++;
        }

        this.curToken = {
            type: TTokenType.COMMENT,
            value: this.buf.substring(this.pos, endpos),
            pos: this.pos
        };
        this.pos = endpos + 1;
        return true;
    }

    _process_identifier(): boolean {
		let endpos= this.pos + 1;
        while (endpos < this.buflen &&
                Lexer._isalphanum(this.buf.charAt(endpos))) {
            endpos++;
        }

        this.curToken = {
            type: TTokenType.IDENTIFIER,
            value: this.buf.substring(this.pos, endpos),
            pos: this.pos
		};

		switch(this.curToken.value.toUpperCase()) {
			case 'IF': 		this.curToken.type= TTokenType.I_IF; break;
			case 'AND': 	this.curToken.type= TTokenType.I_AND; break;
			case 'OR': 		this.curToken.type= TTokenType.I_OR; break;
			case 'NOT': 	this.curToken.type= TTokenType.I_NOT; break;
		}

        this.pos = endpos;
        return true;
    }

    _process_quote(quoteChar: string): boolean {
        // this.pos points at the opening quote. Find the ending quote.
        var end_index = this.buf.indexOf(quoteChar, this.pos + 1);

        if (end_index === -1) {
            throw Error('Unterminated quote at ' + this.pos);
        } else {
            this.curToken = {
                type: TTokenType.QUOTE,
                value: this.buf.substring(this.pos, end_index + 1),
                pos: this.pos
            };
            this.pos = end_index + 1;
            return true;
        }
    }

    _skipnontokens() {
        while (this.pos < this.buflen) {
            var c = this.buf.charAt(this.pos);
            if (c == ' ' || c == '\t' || c == '\r' || c == '\n') {
                this.pos++;
            } else {
                break;
            }
        }
    }
}
