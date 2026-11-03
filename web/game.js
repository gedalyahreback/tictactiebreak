(function(root){
const lines=[[1,0],[0,1],[1,1],[1,-1]];
function winner(board,n,k){for(let i=0;i<board.length;i++){if(board[i]===null)continue;let r=Math.floor(i/n),c=i%n;for(const [dr,dc] of lines){let cells=[];for(let j=0;j<k;j++){let y=r+dr*j,x=c+dc*j;if(y<0||x<0||y>=n||x>=n||board[y*n+x]!==board[i])break;cells.push(y*n+x)}if(cells.length===k)return{player:board[i],cells}}}return null}
function expand(board,n,mode){let offset=mode==='triple-ring'?3:mode==='double-ring'?2:1,size=n+2*offset,next=Array(size*size).fill(null);board.forEach((v,i)=>next[(Math.floor(i/n)+offset)*size+i%n+offset]=v);return{board:next,n:size,offset}}
function chooseMove(board,n,k,player,count){const empty=board.map((v,i)=>v===null?i:-1).filter(i=>i>=0);for(let p of [player,...Array.from({length:count},(_,i)=>i).filter(i=>i!==player)]){for(const i of empty){board[i]=p;let w=winner(board,n,k);board[i]=null;if(w)return i}}
let best=-Infinity,move=empty[0];for(const i of empty){let score=0,r=Math.floor(i/n),c=i%n;for(const [dr,dc]of lines){for(let start=0;start<k;start++){let own=0,other=0,valid=true;for(let j=0;j<k;j++){let y=r+(j-start)*dr,x=c+(j-start)*dc;if(y<0||x<0||y>=n||x>=n){valid=false;break}let v=board[y*n+x];if(v===player)own++;else if(v!==null)other++}if(valid){if(!other)score+=3**own;if(!own)score+=2**other*.8}}}score-=Math.abs(r-(n-1)/2)*.05+Math.abs(c-(n-1)/2)*.05;if(score>best){best=score;move=i}}return move}
function winLength(initial,expansions){return initial+2*expansions}
const api={winner,expand,chooseMove,winLength};if(typeof module!=='undefined')module.exports=api;else root.Game=api;
})(typeof window!=='undefined'?window:globalThis);
