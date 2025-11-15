import { CodeEmitter } from "./codeemitter";
import type { TToken } from "./lexer";
import { Lexer, TTokenType } from "./lexer";
import type { TCodeContainer, TVarDict, TVMRegister } from "./vmdef";
import { CompilerError, Flags, TVMInstruction } from "./vmdef";

//class ParserError extends Error {};

/*
    statement -> statement affect | affect
    affect -> identifier "=" expr
    factor -> '(' expr ')' | identifier | number | '-' factor
*/

// type TVarDef = { id: number; value?: unknown };
type TCompileOptions = { vars?: TVarDict };

export class Parser {
	//private vars: VMDef.TVarDict= {};
	private lex: Lexer = new Lexer();
	codeEmitter: CodeEmitter = new CodeEmitter();

	compile(src: string, options: TCompileOptions = {}): TCodeContainer {
		this.codeEmitter = new CodeEmitter(options.vars);

		this.lex = new Lexer(src);
		this.lex.tokenize();

		do {
			this.parseExpr(0);
		} while (!this.lex.eof());

		this.codeEmitter.emits(TVMInstruction.HLT);

		return this.codeEmitter.obj();
	}
	/*
    getID(name: string): any {
        if(!this.vars.hasOwnProperty(name))
            throw new ParserError(`VAR : Undefined variable "${name}"`);
        return this.vars[name].id; 
    }

    declare(name: string): void { 
        if(!this.vars.hasOwnProperty(name))
            this.vars[name]= { id: Object.keys(this.vars).length };
        else
            throw new ParserError(`VAR : Already defined variable "${name}"`);
    }
*/
	/*
    parseStatement(exprLevel: number): void {
        do {
            this.parseAffect(exprLevel);
        } while(this.lex.next());
    }

    parseAffect(exprLevel: number): void {
        let varDst: TVarDef,
            tok: TToken;

        tok= this.lex.token();
        if(tok.type != TTokenType.IDENTIFIER)
            throw new ParserError('Missing IDENTIFIER at '+tok.pos);

        if(this.vars.hasOwnProperty(tok.value))
            varDst= this.vars[tok.value];
        else {
            varDst=  {id:Object.keys(this.vars).length };
            this.vars[tok.value]= varDst;
        }

        this.lex.next();
        tok= this.lex.token();

        if(tok.type != TTokenType.EQUALS)
            throw new ParserError('Missing "=" at '+tok.pos);

        this.parseExpr(exprLevel);

        this.codeEmitter.emits( VMDef.TVMInstruction.STO | VMDef.MSK_IS_VAR, varDst.id );

    }
*/
	/*
    returns integer expression result or SE

        expr -> expr '+' term | expr '-' term | term
        term -> term '*' factor | term '/' factor | factor
        factor -> '(' expr ')' | identifier | number | '-' factor
    */
	private parseExpr(exprLevel: number): void {
		let tok: TToken;

		console.log(`parseExpr(${exprLevel})`);

		this.codeEmitter.emits(TVMInstruction.MOV + exprLevel);

		this.parse_cmp(exprLevel);

		while (true) {
			tok = this.lex.token();
			switch (tok.type) {
				case TTokenType.I_AND:
					this.lex.next();
					this.codeEmitter.emits(TVMInstruction.AND + exprLevel);
					this.parse_cmp(exprLevel);
					break;

				case TTokenType.I_OR:
					this.lex.next();
					this.codeEmitter.emits(TVMInstruction.OR + exprLevel);
					this.parse_cmp(exprLevel);
					break;

				default:
					return;
			}
		}
	}

	private parse_cmp(exprLevel: number): void {
		let tok: TToken;

		console.log(`parse_cmp(${exprLevel})`);

		this.parse_add(exprLevel);

		while (true) {
			tok = this.lex.token();
			switch (tok.type) {
				case TTokenType.LT:
					this.lex.next();
					this.codeEmitter.emits(TVMInstruction.LT + exprLevel);
					this.parse_add(exprLevel);
					break;
				case TTokenType.GT:
					this.lex.next();
					this.codeEmitter.emits(TVMInstruction.GT + exprLevel);
					this.parse_add(exprLevel);
					break;
				case TTokenType.LTE:
					this.lex.next();
					this.codeEmitter.emits(TVMInstruction.LTE + exprLevel);
					this.parse_add(exprLevel);
					break;
				case TTokenType.GTE:
					this.lex.next();
					this.codeEmitter.emits(TVMInstruction.GTE + exprLevel);
					this.parse_add(exprLevel);
					break;
				case TTokenType.EQUALS:
					this.lex.next();
					this.codeEmitter.emits(TVMInstruction.EQ + exprLevel);
					this.parse_add(exprLevel);
					break;
				case TTokenType.NOTEQUALS:
					this.lex.next();
					this.codeEmitter.emits(TVMInstruction.NE + exprLevel);
					this.parse_add(exprLevel);
					break;
				default:
					return;
			}
		}
	}

	private parse_add(exprLevel: number): void {
		console.log(`parse_add(${exprLevel})`);

		this.parse_product(exprLevel);

		while (true) {
			if (this.lex.isToken(TTokenType.PLUS)) {
				this.lex.next();
				this.codeEmitter.emits(TVMInstruction.ADD + exprLevel);
				this.parse_add(exprLevel);
			} else if (this.lex.isToken(TTokenType.MINUS)) {
				this.lex.next();
				this.codeEmitter.emits(TVMInstruction.SUB + exprLevel);
				this.parse_add(exprLevel);
			} else return;
		}
	}

	private parse_product(exprLevel: number): void {
		console.log(`parse_product(${exprLevel})`);

		this.parse_term(exprLevel); //parse_number();

		while (true) {
			//if(this.lex.isLookahead(TTokenType.MULTIPLY)) {
			if (this.lex.isToken(TTokenType.MULTIPLY)) {
				this.lex.next();
				this.codeEmitter.emits(TVMInstruction.MUL + exprLevel);

				this.parse_term(exprLevel);
			}
			//else if(this.lex.isLookahead(TTokenType.DIVIDE)) {
			else if (this.lex.isToken(TTokenType.DIVIDE)) {
				this.lex.next();
				this.codeEmitter.emits(TVMInstruction.DIV + exprLevel);
				this.parse_term(exprLevel);
			} else return;
		}
	}

	private parse_term(exprLevel: number) {
		let tok: TToken,
			lastOp1: TVMInstruction,
			lastOp2: TVMInstruction,
			parmCount: number,
			posInObj: number;

		//tok= this.lex.lookahead();
		tok = this.lex.token();

		console.log(`parse_term(${exprLevel})`, tok);

		switch (tok.type) {
			case TTokenType.I_IF: // "IF( <cond>, <formIfTrue>, <formIfFalse> )"
				if (!this.lex.isLookahead(TTokenType.L_PAREN))
					throw new CompilerError('IF: Syntax Error: Missing "("');
				this.lex.next();

				this.lex.next();
				lastOp1 = this.codeEmitter.pop();

				this.parseExpr(exprLevel + 1);
				if (!this.lex.isToken(TTokenType.COMMA))
					throw new CompilerError(
						"IF: SYNTAX ERROR IF(cond, formIfTrue, formIfFalse) ",
					);
				this.lex.next();
				this.codeEmitter.emits(TVMInstruction.BZ + (exprLevel + 1), -1);
				posInObj = this.codeEmitter.curPos();
				this.parseExpr(exprLevel + 1);
				if (!this.lex.isToken(TTokenType.COMMA))
					throw new CompilerError(
						"IF: SYNTAX ERROR IF(cond, formIfTrue, formIfFalse) ",
					);
				this.lex.next();
				this.codeEmitter.emits(TVMInstruction.NOP);
				this.codeEmitter.change(posInObj, this.codeEmitter.curPos() - posInObj);
				posInObj = this.codeEmitter.curPos();
				this.parseExpr(exprLevel + 1);
				this.codeEmitter.change(
					posInObj,
					TVMInstruction.BRA + this.codeEmitter.curPos() - posInObj,
				);

				this.codeEmitter.emits(
					lastOp1 | (Flags.MSK_IS_REG + (exprLevel + 1) * 16),
				);

				if (!this.lex.isToken(TTokenType.R_PAREN))
					throw new CompilerError('IF: Syntax Error: Missing ")"');
				this.lex.next();
				break;

			case TTokenType.IDENTIFIER: // function call :  <id> "(" <parmList> ")"
				if (!this.lex.isLookahead(TTokenType.L_PAREN))
					return this.parse_number(exprLevel);

				this.lex.next();
				this.lex.next();
				lastOp1 = this.codeEmitter.pop();

				parmCount = 0;
				do {
					this.parseExpr(exprLevel + 1);
					if (this.codeEmitter.lastIs(TVMInstruction.MOV, Flags.VAL_2IMM, 2)) {
						lastOp2 = this.codeEmitter.pop();
						this.codeEmitter.pop();
						this.codeEmitter.emits(
							TVMInstruction.PSH | Flags.VAL_1IMM,
							lastOp2,
						);
					} else
						this.codeEmitter.emits(
							TVMInstruction.PSH | (Flags.MSK_IS_REG + (exprLevel + 1)),
						);
					parmCount++;
				} while (this.lex.isToken(TTokenType.COMMA) && this.lex.next());

				if (parmCount > 15)
					throw new CompilerError("FNCALL: Too many parms. Max is 15");

				this.codeEmitter.emits(
					TVMInstruction.CAL |
						Flags.MSK_IS_REG |
						(Flags.MSK_IS_VAR + (parmCount << 4) + (exprLevel + 1)),
				);
				this.codeEmitter.emitsVar(tok.value);

				this.codeEmitter.emits(
					lastOp1 | (Flags.MSK_IS_REG + (exprLevel + 1) * 16),
				);

				if (!this.lex.isToken(TTokenType.R_PAREN))
					throw new CompilerError('TERM: Syntax Error: Missing ")"');
				this.lex.next();
				break;

			case TTokenType.L_PAREN:
				this.lex.next();
				lastOp1 = this.codeEmitter.pop();
				this.parseExpr(exprLevel + 1);
				this.codeEmitter.emits(
					(lastOp1 & Flags.MSK_NOFLAG) |
						(Flags.MSK_IS_REG + (exprLevel + 1) * 16),
				);

				if (!this.lex.isToken(TTokenType.R_PAREN))
					throw new CompilerError('TERM: Syntax Error: Missing ")"');
				this.lex.next();
				break;

			case TTokenType.MINUS:
				this.lex.next();
				this.parse_term(exprLevel);

				if (this.codeEmitter.lastIs(TVMInstruction.MOV, Flags.VAL_2IMM, 2)) {
					this.codeEmitter.emits(-Number(this.codeEmitter.pop()));
				} else
					this.codeEmitter.emits(
						TVMInstruction.NEG | (Flags.MSK_IS_REG + exprLevel),
					);
				break;

			case TTokenType.I_NOT:
				this.lex.next();
				this.parse_term(exprLevel);
				this.codeEmitter.emits(
					TVMInstruction.NOT | (Flags.MSK_IS_REG + exprLevel),
				);
				break;

			default:
				this.parse_number(exprLevel);
		}
	}

	private parse_number(exprLevel: number): void {
		let tok: TToken,
			// varDst: TVarDef,
			opc: TVMInstruction,
			reg: TVMRegister,
			num: number;

		tok = this.lex.token();
		this.lex.next();

		console.log("parse_number", tok);

		switch (tok.type) {
			case TTokenType.PERIOD:
			case TTokenType.NUMBER:
				if (tok.type === TTokenType.PERIOD) {
					if (!this.lex.isToken(TTokenType.NUMBER))
						throw new CompilerError(`NUMBER : Syntax Error at ${tok.pos}`);
					num = Number(`.${this.lex.token().value}`);
					this.lex.next();
				} else {
					if (this.lex.isToken(TTokenType.PERIOD)) {
						this.lex.next();
						if (this.lex.isToken(TTokenType.NUMBER)) {
							num = Number(`${tok.value}.${this.lex.token().value}`);
							this.lex.next();
						} else num = Number(tok.value);
					} else num = Number(tok.value);
				}

				if (
					num === 0 &&
					this.codeEmitter.lastIs(TVMInstruction.MOV, Flags.VAL_2IMM)
				) {
					opc = this.codeEmitter.pop();
					reg = this.codeEmitter.getReg1(opc);
					this.codeEmitter.emits(TVMInstruction.CLR | Flags.MSK_IS_REG | reg);
				} else this.codeEmitter.emits(num);
				break;

			case TTokenType.IDENTIFIER:
				try {
					if (this.lex.isToken(TTokenType.AFFECT)) {
						opc = this.codeEmitter.pop();
						this.lex.next();
						num = this.codeEmitter.define(tok.value);
						this.parseExpr(exprLevel + 1);
						this.codeEmitter.emits(
							TVMInstruction.MOV |
								Flags.MSK_IS_VAR |
								(Flags.MSK_IS_REG + (exprLevel + 1)),
							num,
						);
						this.codeEmitter.emits(
							(opc & Flags.MSK_OPC) |
								(Flags.MSK_IS_REG + ((exprLevel + 1) << 4) + exprLevel),
						);
					} else {
						this.codeEmitter.setLastAsVar();
						this.codeEmitter.emitsVar(tok.value);
					}
				} catch (e) {
					throw new CompilerError(`${(e as Error).message} at ${tok.pos}`);
				}
				break;

			default:
				throw new CompilerError(`NUMBER : Syntax Error at ${tok.pos}`);
		}
	}
}
