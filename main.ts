import { Disasm } from "./disasm";
import { Parser } from "./parser";
import { VM } from "./vm";

import Benchmark = require("benchmark");
//import recast= require('recast');

const parser = new Parser();
//let src= 'V=1+3*(8/6)-7';
//let src= 'K=5 V=1+K-(1+(-6*K))';
const src = "1+K-(1+(-6*K))";
const disassembler = new Disasm();
let vm: VM;
const vars = {
	K: 5,
	do: (p: number, j: number) => {
		console.log("do", p, j, p * j);
		return p * j;
	},

	CRDDEX: 25,
	CNBMEX: 1,
	CTEX: 1,
	KTEX: 1,
};

//let result= parser.compile( 'V=1;S="test"+getvar(V);' );
try {
	parser.compile(src, { vars: vars });

	console.log("---- SRC");
	console.log(src);
	console.log("---- DISAM");
	console.log(disassembler.disasm(parser.codeEmitter.obj()));
	console.log("----");

	vm = new VM(parser.codeEmitter.obj());
	vm.run();
	vm.dumpAfter(true);
} catch (e) {
	console.error("\n!!EXCEPTION !!");
	console.error((e as Error).message);
	console.error(src);
}

/*
	
// let ast= recast.parse( 'let K=5,V=1+K-(1+(-6*K));' );
// console.log( ast.program.body[0] );
	const fn = new Function("return 1+K-(1+(-6*K))");
	const fn2 = function () {
		return 1 + K - (1 + -6 * K);
	};

	let K = 5;

	let suite = new Benchmark.Suite();

	suite
		.add("VM1", function () {
			vm.run();
		})
		.add("VM2", function () {
			fn();
		})
		.add("VM3", function () {
			fn2();
		})
		// add listeners
		.on("cycle", function (event: any) {
			console.log(String(event.target));
		})
		.on("complete", () => {
			console.log("Fastest is " + suite.filter("fastest"));
		})
		// run async
		.run({ async: true });
*/
