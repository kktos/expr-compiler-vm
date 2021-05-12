import {Parser} from './parser';
import {VM} from './vm';
import {Disasm} from './disasm';
import Benchmark= require('benchmark');
//import recast= require('recast');

let parser= new Parser();
//let src= 'V=1+3*(8/6)-7';
//let src= 'K=5 V=1+K-(1+(-6*K))';
let src= '1+K-(1+(-6*K))';
let disassembler= new Disasm();
let vm: VM;
let vars= {
 "K":	5, 
 "do":	function(p:number,j:number){ console.log("do",p,j,p*j);return p*j; },

 "CRDDEX": 25,
 "CNBMEX": 1,
 "CTEX": 1,
 "KTEX": 1,

};

//let result= parser.compile( 'V=1;S="test"+getvar(V);' );
try {
	let result= parser.compile( src, { vars: vars} );
	
    console.log('---- SRC');
    console.log(src);
    console.log('---- DISAM');
    console.log(disassembler.disasm(parser.codeEmitter.obj()));
	console.log('----');

	vm= new VM( parser.codeEmitter.obj() );
	vm.run();
	vm.dumpAfter(true);

}
catch(e) {
    console.error('\n!!EXCEPTION !!');
    console.error(e.message);
    console.error(src);
}


if(0) {

/*
let ast= recast.parse( 'let K=5,V=1+K-(1+(-6*K));' );
console.log( ast.program.body[0] );
*/
let fn= new Function('return 1+K-(1+(-6*K))');
let fn2= function() {return 1+K-(1+(-6*K))};

var K=5;

var suite = new Benchmark.Suite;
 
suite.add('VM1', function() {
    vm.run();
})
.add('VM2', function() {
    fn();
})
.add('VM3', function() {
    fn2();
})
// add listeners 
.on('cycle', function(event: any) {
  console.log(String(event.target));
})
.on('complete', () => { console.log('Fastest is ' + suite.filter('fastest')); })
// run async 
.run({ 'async': true });

}
