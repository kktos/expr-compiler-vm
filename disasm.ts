import { Flags, TVMRegister, TVMInstruction, TCodeContainer } from './vmdef';
import {wordToHex} from './utils';

export class Disasm {

    varNameFromID(id: number, names: string[]= []): string {
        return '[V'+id +':'+ names[id]  + ']';
    }

	static decode(code: number[]): string {
		let op: TVMInstruction,
			opSrc: number,
			parm: number,
			result: string,
			regDst: TVMRegister,
            regSrc: TVMRegister,
			mode2ope: boolean,
			noParms: boolean,
			isVAR: boolean,
			isREG: boolean,
			isIMM: boolean;

		opSrc= code[0];
		parm= code.length>1 ? code[1] : NaN;

        op= opSrc & Flags.MSK_OPC;
		noParms= (opSrc & Flags.MSK_FLAGS) == 0;
		mode2ope= (opSrc & Flags.MSK_2OP) != 0;
		isVAR= (opSrc & Flags.MSK_IS_VAR) != 0;
		isREG= (opSrc & Flags.MSK_IS_REG) != 0;
		isIMM= (opSrc & Flags.MSK_2OP) ? (!isVAR && !isREG) : (isVAR && isREG);
        regDst= opSrc & Flags.MSK_REG1;
			
		result= wordToHex(0) + ': ' + wordToHex(opSrc);
		
		if(noParms || (!isIMM && isREG))
			result+= ''.padStart(4);
		else
			result+= ' '+ (isNaN(parm) ? '????' : wordToHex(parm));

		result+= ' '+ TVMInstruction[op];

		if(mode2ope) {
			result+= ' ' + TVMRegister[regDst] + ', ';
			if(isVAR || isIMM) {
				if(op == TVMInstruction.BZ) {
					result+= '@' + (isNaN(parm) ? '????' : wordToHex(parm));
				}
				else {
					result+= isVAR ? 'V'+(isNaN(parm) ? '????' : wordToHex(parm)) : '#'+(isNaN(parm) ? '????' : wordToHex(parm));
					if(op == TVMInstruction.CAL) {
						regSrc= (<number>opSrc & Flags.MSK_REG2) >> 4;
						result+= `(${regSrc})`;
					}
				}
			}
			else {
				regSrc= (<number>opSrc & Flags.MSK_REG2) >> 4;
				result+= TVMRegister[regSrc];
			}
		}
		else {
			if(isIMM)
				result+= ' #' + (isNaN(parm) ? '????' : wordToHex(parm));
			else 
			if(isREG)
				result+= ' ' + TVMRegister[regDst];
			else 
			if(isVAR)
				result+= ' ' + 'V'+(isNaN(parm) ? '????' : wordToHex(parm))
			else
			if(op == TVMInstruction.BRA)
				result+= ' @' + wordToHex(opSrc & Flags.MSK_ALLREG);
		}
		
		return result;

	}

    disasm(prg: TCodeContainer, curIdx: number= 0, lineCount: number= -1): string {
        let codeLen= prg.CODE.length,
            result: string,
            opSrc: TVMInstruction,
            op: TVMInstruction,
            regDst: TVMRegister,
            regSrc: TVMRegister,
            isVAR: boolean,
            isREG: boolean,
            isIMM: boolean,
            noParms: boolean,
            mode2ope: boolean,
            parm: any;

        if(codeLen == 0)
            return 'EMPTY';

        if(curIdx<0)
            curIdx= 0;
        if(lineCount<0)
            lineCount= Number.MAX_SAFE_INTEGER;

        result= '';
        while(curIdx < codeLen && lineCount--) {

            opSrc= Number(prg.CODE[curIdx]);
            op= opSrc & Flags.MSK_OPC;
            regDst= opSrc & Flags.MSK_REG1;
            noParms= (opSrc & Flags.MSK_FLAGS) == 0;
            mode2ope= (opSrc & Flags.MSK_2OP) != 0;
            isVAR= (opSrc & Flags.MSK_IS_VAR) != 0;
            isREG= (opSrc & Flags.MSK_IS_REG) != 0;
            isIMM= (opSrc & Flags.MSK_2OP) ? (!isVAR && !isREG) : (isVAR && isREG);

            result+= wordToHex(curIdx) + ': ' + wordToHex(opSrc) + ' ';

            curIdx++;

			if(noParms || (!isIMM && isREG && !isVAR))
				result+= ''.padStart(4);
			else
				result+= wordToHex(prg.CODE[curIdx]);

			result+= ' ' + (mode2ope? '2':'.')+ (isREG?'R':'.')+ (isVAR?'V':'.')+ (isIMM?'#':'.');
			
            result+= ' ' + TVMInstruction[op];

            if(mode2ope) {

				if(isVAR && isREG) {
					parm= prg.CODE[curIdx++];
					result+= ' ' + this.varNameFromID(parm, prg.DBUG) + ', ' + TVMRegister[regDst];
				}
				else {
					result+= ' ' + TVMRegister[regDst] + ', ';
					if(isVAR || isIMM) {
						parm= prg.CODE[curIdx++];
						if(op == TVMInstruction.BZ) {
							result+= '@' + wordToHex(curIdx + parm);
						}
						else {
							result+= isVAR ? this.varNameFromID(parm, prg.DBUG) : '#'+parm;
							if(op == TVMInstruction.CAL) {
								regSrc= (<number>opSrc & Flags.MSK_REG2) >> 4;
								result+= `(${regSrc})`;
							}
						}
					}
					else {
						regSrc= (<number>opSrc & Flags.MSK_REG2) >> 4;
						result+= TVMRegister[regSrc];
					}
				}
            }
            else {
                if(isIMM)
                    result+= ' #' + prg.CODE[curIdx++];
                else 
                if(isREG)
                    result+= ' ' + TVMRegister[regDst];
                else 
                if(isVAR)
					result+= ' ' + this.varNameFromID(prg.CODE[curIdx++], prg.DBUG)
				else
				if(op == TVMInstruction.BRA)
                   	result+= ' @' + wordToHex(curIdx + (opSrc & Flags.MSK_ALLREG));
            }

            result+= "\n";
        }

        return result;
    }

}