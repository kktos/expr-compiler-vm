import { TCodeContainer, TVMInstruction, TVMRegister, Flags } from './vmdef';
import {Disasm} from './disasm';
import {wordToHex} from './utils';

const REGISTER_COUNT= 9;

type TRunOptions=  { vars?: any[]  };

export class VM {
    private registers: Float64Array;
    private pc: number;
    private eom: number;
    private mem: any[];
    private vars: any[];
    private stack: any[];
    private codeObj: TCodeContainer;

    constructor(prg: TCodeContainer) {
        this.registers= new Float64Array(REGISTER_COUNT);
        this.pc= 0;
        this.mem= prg.CODE;
        this.eom= this.mem.length-1;
        this.vars= prg.DATA;
		this.stack= [];
		this.codeObj= prg;
    }

    dumpBefore() {
        let disassembler= new Disasm();
        console.log(disassembler.disasm(this.codeObj, this.pc, 1));
    }

    dumpAfter(showVars: boolean= false) {
        let s: string;
        s= 'PC= '+wordToHex(this.pc)+ ' EOM= '+this.eom+ ' ';
        this.registers.forEach( (v,idx)=> s+="R"+(idx+1)+"= "+v+"    " );
		console.log(s);

		if(showVars) {
			console.log(`VARS(${this.vars.length})`);
			this.vars.forEach( (v,idx)=> console.log(`    V${idx}:${this.codeObj.DBUG[idx]} = ${v}`) );
		}

		s= '';
        this.stack.forEach( (v,idx)=> s+=`S${idx}=${v} | ` );
		console.log(`STACK(${this.stack.length})`, s);

        console.log('----------');
    }

    run(options:TRunOptions= {}) {
        let op: TVMInstruction,
            regDst: TVMRegister,
            regSrc: TVMRegister= 0,
            parm: number= 0,
            isREG: boolean,
            isVAR: boolean,
            isIMM: boolean;

        //if(Array.isArray(options.vars)) this.vars= options.vars;
        
        while(this.pc<=this.eom) {

            this.dumpBefore();

            op= Number(this.mem[this.pc++]);
            regDst= op & Flags.MSK_REG1;
            isREG= 0 != (op & Flags.MSK_IS_REG);
            isVAR= 0 != (op & Flags.MSK_IS_VAR);
			isIMM= (op & Flags.MSK_2OP) ? (!isVAR && !isREG) : (isVAR && isREG);
			
            //if(op & Flags.MSK_2OP && !isREG)
            if(isIMM || isVAR)
                parm= Number(this.mem[this.pc++]);
            if(isREG)
                regSrc= (op & Flags.MSK_REG2) >>4;

            switch(op & Flags.MSK_OPC) {

                case TVMInstruction.CLR:
                    this.registers[regDst]= 0;
                    break;

                case TVMInstruction.PSH:
                    this.stack.push(isIMM ? parm : isVAR ? this.vars[parm] : this.registers[regDst]);
					break;
					
				case TVMInstruction.POP:
					if(isIMM) {
						if(parm>this.stack.length)
							throw new Error("STACK: OUT OF BOUNDS");
						this.stack.length-= parm;
					}
                    else
                        throw new Error("BAD OPCODE "+ wordToHex(op));
					break;
					
                case TVMInstruction.CAL:
                    if(!isVAR)
                        throw new Error("BAD OPCODE "+ wordToHex(op));
					this.registers[regDst]= this.vars[parm].apply({}, this.stack.slice(-regSrc));
					this.stack.length-= regSrc;
                    break;


				case TVMInstruction.BRA:
					this.pc += op & Flags.MSK_ALLREG;
					break;
                case TVMInstruction.BZ:
                    if(!this.registers[regDst])
						this.pc += parm;
					break;

                case TVMInstruction.LT:
                    this.registers[regDst]= (this.registers[regDst] < (isREG ? this.registers[regSrc] : parm)) ? 1 : 0;
					break;
				case TVMInstruction.GT:
                    this.registers[regDst]= (this.registers[regDst] > (isREG ? this.registers[regSrc] : parm)) ? 1 : 0;
					break;
                case TVMInstruction.LTE:
                    this.registers[regDst]= (this.registers[regDst] <= (isREG ? this.registers[regSrc] : parm)) ? 1 : 0;
					break;
				case TVMInstruction.GTE:
                    this.registers[regDst]= (this.registers[regDst] >= (isREG ? this.registers[regSrc] : parm)) ? 1 : 0;
					break;
				case TVMInstruction.EQ:
                    this.registers[regDst]= (this.registers[regDst] = (isREG ? this.registers[regSrc] : parm)) ? 1 : 0;
					break;
				case TVMInstruction.NE:
                    this.registers[regDst]= (this.registers[regDst] != (isREG ? this.registers[regSrc] : parm)) ? 1 : 0;
					break;

				case TVMInstruction.AND:
                    this.registers[regDst]= (this.registers[regDst] && (isREG ? this.registers[regSrc] : parm)) ? 1 : 0;
					break;
				case TVMInstruction.OR:
                    this.registers[regDst]= (this.registers[regDst] || (isREG ? this.registers[regSrc] : parm)) ? 1 : 0;
					break;
				case TVMInstruction.NOT:
                    this.registers[regDst]= this.registers[regDst] ? 0 : 1;
					break;

					
                case TVMInstruction.ADD:
                    this.registers[regDst]+= isVAR ? this.vars[parm] : isREG ? this.registers[regSrc] : parm;
                    break;
                case TVMInstruction.SUB:
                    this.registers[regDst]-= isVAR ? this.vars[parm] : isREG ? this.registers[regSrc] : parm;
                    break;
                case TVMInstruction.MUL:
                    this.registers[regDst]*= isVAR ? this.vars[parm] : isREG ? this.registers[regSrc] : parm;
                    break;
				case TVMInstruction.NEG:
                    this.registers[regDst]= -this.registers[regDst];
					break;

				case TVMInstruction.MOV:
					if(isVAR && isREG)
						this.vars[parm]= this.registers[regDst];
					else
	                    this.registers[regDst]= isVAR ? this.vars[parm] : isREG ? this.registers[regSrc] : parm;
                    break;
/*
                case TVMInstruction.STO:
                    if(isVAR)
                        this.vars[parm]= this.registers[regDst];
                    else
                    if(isREG)
                        this.registers[parm]= this.registers[regDst];
                    break;
*/
                case TVMInstruction.NOP:
                    break;

                case TVMInstruction.HLT:
                    return;
                    
                default:
                    throw new Error("BAD OPCODE "+ wordToHex(op));

            }
            this.dumpAfter();
        }

    }
    
}