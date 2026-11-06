/* 示例换算：按科类给出分数→位次的分段映射，中间线性插值 */
window.RANK_MAP = {
  理: [
    [700,100],[680,300],[660,900],[640,2000],[620,4000],
    [600,7000],[580,11000],[560,16000],[540,22000],[520,30000],
    [500,40000],[480,52000],[460,66000],[440,82000]
  ],
  文: [
    [680,50],[660,200],[640,600],[620,1500],[600,3000],
    [580,5500],[560,9000],[540,14000],[520,20000],[500,28000],
    [480,38000],[460,50000],[440,64000]
  ]
};

window.scoreToRank = function(subject, score){
  const table = window.RANK_MAP[subject];
  if (!table) return null;
  if (score >= table[0][0]) return table[0][1];
  if (score <= table[table.length-1][0]) return table[table.length-1][1];
  for (let i=0;i<table.length-1;i++){
    const [s1,r1] = table[i];
    const [s2,r2] = table[i+1];
    if (score <= s1 && score >= s2){
      const t = (s1 - score) / (s1 - s2);
      return Math.round(r1 + (r2 - r1) * t);
    }
  }
  return null;
};