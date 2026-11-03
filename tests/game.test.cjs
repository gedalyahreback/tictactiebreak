const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {runInNewContext}=require('node:vm');
const {join}=require('node:path');
// Load the exact browser engine while the repository uses ES modules.
const context={module:{exports:{}}};
runInNewContext(readFileSync(join(__dirname,'../web/game.js'),'utf8'),context);
const {winner,expand,chooseMove,winLength}=context.module.exports;
test('detects every winning direction and returns exact cells',()=>{for(const cells of [[0,1,2],[0,3,6],[0,4,8],[2,4,6]]){const b=Array(9).fill(null);cells.forEach(i=>b[i]=0);assert.equal(JSON.stringify(winner(b,3,3)),JSON.stringify({player:0,cells}))}});
test('does not wrap a winning line across rows',()=>{assert.equal(winner([null,null,0,0,0,null,null,null,null],3,3),null)});
test('both expansion options add equal space on all four sides and center every mark',()=>{let b=[0,1,0,0,1,1,1,0,0];assert.equal(winner(b,3,3),null);for(const mode of ['ring','double-ring']){let g=expand(b,3,mode),o=mode==='ring'?1:2;assert.equal(g.n,3+o*2);assert.equal(g.offset,o);b.forEach((v,i)=>assert.equal(g.board[(Math.floor(i/3)+o)*g.n+i%3+o],v));assert.equal(g.board.filter(v=>v!==null).length,9);for(let r=0;r<g.n;r++)for(let c=0;c<g.n;c++)if(r<o||c<o||r>=g.n-o||c>=g.n-o)assert.equal(g.board[r*g.n+c],null)}});
test('winning requirement always increases by two per expansion',()=>{assert.equal(winLength(3,0),3);assert.equal(winLength(3,1),5);assert.equal(winLength(3,2),7);assert.equal(winLength(4,3),10)});
test('no first expansion move can win from any drawn 3x3 board with either expansion size',()=>{let draws=0;for(let mask=0;mask<512;mask++){let b=Array.from({length:9},(_,i)=>(mask>>i)&1);if(b.filter(v=>v===0).length!==5||winner(b,3,3))continue;draws++;for(const mode of ['ring','double-ring']){let g=expand(b,3,mode);for(let i=0;i<g.board.length;i++)if(g.board[i]===null){for(let p=0;p<2;p++){g.board[i]=p;assert.equal(winner(g.board,g.n,winLength(3,1)),null)}g.board[i]=null}}}assert.ok(draws>0)});
test('expanded games require five in a row, then seven',()=>{for(const k of [5,7]){let b=Array(k*k).fill(null);for(let c=0;c<k-1;c++)b[c]=0;assert.equal(winner(b,k,k),null);b[k-1]=0;assert.equal(winner(b,k,k).player,0)}});
test('supports five players and larger boards',()=>{let b=Array(36).fill(null);[7,14,21,28].forEach(i=>b[i]=4);assert.equal(JSON.stringify(winner(b,6,4)),JSON.stringify({player:4,cells:[7,14,21,28]}))});
test('computer wins, blocks and never mutates the board',()=>{let b=[1,1,null,0,0,null,null,null,null],copy=b.slice();assert.equal(chooseMove(b,3,3,1,2),2);assert.deepEqual(b,copy);b=[0,0,null,null,1,null,null,null,null];assert.equal(chooseMove(b,3,3,1,2),2);b=Array(25).fill(null);[0,1,2,3].forEach(i=>b[i]=0);b[5]=1;assert.equal(chooseMove(b,5,5,1,2),4)});
test('computer selects free squares under both expansion rules and updated targets',()=>{for(const mode of ['ring','double-ring']){let b=[0,1,0,0,1,1,1,0,0],g=expand(b,3,mode),p=1;for(let t=0;t<12;t++){let copy=g.board.slice(),i=chooseMove(g.board,g.n,5,p,2);assert.equal(g.board[i],null);assert.deepEqual(g.board,copy);g.board[i]=p;if(winner(g.board,g.n,5))break;p=1-p}}});

test('five-player expansion adds three rows and columns on every side but only two to the winning length',()=>{const b=[0,1,2,3,4,0,1,2,3];assert.equal(winner(b,3,3),null);const g=expand(b,3,'triple-ring');assert.equal(g.n,9);assert.equal(g.offset,3);b.forEach((v,i)=>assert.equal(g.board[(Math.floor(i/3)+3)*9+i%3+3],v));assert.equal(g.board.filter(v=>v!==null).length,9);assert.equal(winLength(3,1),5);const next=expand(g.board,g.n,'triple-ring');assert.equal(next.n,15);assert.equal(winLength(3,2),7)});
