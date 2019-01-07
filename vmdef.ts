/*
    Instruction bits
    F-D:    flags
            F:    1= 2 operands 0= 1/0 operand
            E:    1= last operand is a Register
            D:    1= last operand is a Variable
    C-8:    opcode (32)
    7-4:    2nd operand register (16)
    3-0:    1st operand register (16)

    flags R:Register / #:value / V:Variable
    F E D
    1 0 0: R, #
    1 1 0: R, R
    1 0 1: R, V
    1 1 1: V, R ; STO
    0 1 0: R
    0 0 1: V
    0 1 1: #
    0 0 0: no parms
*/

export namespace Flags {
	export const
        //            FEDCBA9876543210
        MSK_REG2=   0b0000000011110000,
        MSK_REG1=   0b0000000000001111,
        MSK_NOREG=  0b1111111100000000,
        MSK_ALLREG= 0b0000000011111111,

        MSK_FLAGS=  0b1110000000000000,
        MSK_3IMM=  	0b1110000000000000,
        MSK_2OP=    0b1000000000000000,
        MSK_IS_REG= 0b0100000000000000,
        MSK_IS_VAR= 0b0010000000000000,
        MSK_NOFLAG= 0b1001111111111111,

        MSK_OPC=    MSK_NOFLAG & MSK_NOREG,
        VAL_2IMM=   0x8000,
        VAL_1IMM=   0b0110000000000000,
        VAL_3IMM=   0b1110000000000000;
}

export enum TVMInstruction {
	HLT=0x0000,

    MOV=0x0100 	|Flags.MSK_2OP,
//    STO=0x0200 	|Flags.MSK_2OP,
	CLR=0x0300,
	
    MUL=0x0400 	|Flags.MSK_2OP,
    DIV=0x0500 	|Flags.MSK_2OP,
    ADD=0x0600 	|Flags.MSK_2OP,
    SUB=0x0700 	|Flags.MSK_2OP,
	NEG=0x0800,
	
    AND=0x0900 	|Flags.MSK_2OP,
    OR=0x0A00 	|Flags.MSK_2OP,
	NOT=0x0B00,
	
	MAT=0x0C00,
	
	EQ=0x1000 |Flags.MSK_2OP,
	NE=0x1100 |Flags.MSK_2OP,
	LT=0x1200 |Flags.MSK_2OP,
	GT=0x1300 |Flags.MSK_2OP,
	LTE=0x1400 |Flags.MSK_2OP,
	GTE=0x1500 |Flags.MSK_2OP,

    BRA=0x1A00,
    BZ=0x1B00 |Flags.MSK_2OP,
    CAL=0x1C00 |Flags.MSK_2OP,
    PSH=0x1D00,
    POP=0x1E00,
    NOP=0x1F00
};

export enum TVMRegister {
    R1=0,
    R2,
    R3,
    R4,
    R5,
    R6,
    R7,
    R8,
    R9,
};
export type TVarDict=  { [name: string]: any };
export class CompilerError extends Error {};

export type TObjCode=  TVMInstruction | any;

export type TCodeContainer= {
    CODE:  TObjCode[],
    DATA: any[],
    DBUG: string[]
};