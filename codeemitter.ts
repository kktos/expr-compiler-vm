import { TCodeContainer, TObjCode, TVarDict, CompilerError, TVMInstruction, Flags, TVMRegister } from './vmdef';
import {Disasm} from './disasm';

export class CodeEmitter {
    private codeObj: TObjCode[];
    private vars: TVarDict;

    constructor(vs: TVarDict= {}) {
        this.codeObj= [];
        this.vars= {};

        Object.keys(vs).forEach(name => this.define(name, vs[name]) );

        //this.vars= vs;
    }

    obj(): TCodeContainer {
		let varList:any[]= [],
			varNames:string[]= [];;

		Object.keys(this.vars).forEach(name => {
			varList[this.vars[name].id]= this.vars[name].value;
			varNames.push(name);
		});

        return {
			CODE: this.codeObj,
			DATA: varList,
			DBUG: varNames
			};
    }

	curPos(): number {
		return this.codeObj.length-1;
	}

	change(pos:number, val: number) {
		this.codeObj[pos]= val;
	}

	emits(...parms: any[]) {
        for(let p of parms) {
            this.codeObj.push(p);
		}
		console.log( '...EMITS ',Disasm.decode(parms) );
    }

    pop(): any {
		console.log( '...POPS ',Disasm.decode( this.codeObj.slice(-1) ) );
        return this.codeObj.pop();
	}
	
    emitsVar(v: number|string) {
        this.emits(typeof v == "string" ? this.getID(v) : v);
    }

    getID(name: string): any {
        if(!this.vars.hasOwnProperty(name))
            throw new CompilerError(`VAR : Undefined variable "${name}"`);
        return this.vars[name].id; 
    }

    define(name: string, value: any= undefined): any { 
        if(!this.vars.hasOwnProperty(name))
            this.vars[name]= { id: Object.keys(this.vars).length, value: value };
        else
            throw new CompilerError(`VAR : Already defined variable "${name}"`);
        return this.vars[name].id; 
    }    

    lastIs(op: TVMInstruction, mode: number, offset: number= 1): boolean {
        let flags: number;

        if(this.codeObj.length==0)
            return false;

        flags= op & Flags.MSK_FLAGS;

        return (flags == Flags.VAL_2IMM) && (this.codeObj[this.codeObj.length-offset] & Flags.MSK_OPC) == (op & Flags.MSK_OPC);
    }

    getReg1(op: TVMInstruction): TVMRegister {
        return op & Flags.MSK_REG1;
    }

    setLastAsVar() {
        if(this.codeObj.length>0)
            this.codeObj[this.codeObj.length-1]= this.codeObj[this.codeObj.length-1] | Flags.MSK_IS_VAR;
    }

}