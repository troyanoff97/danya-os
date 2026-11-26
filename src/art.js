export function random(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function texture(scene, key, w, h, paint) {
  const t = scene.textures.createCanvas(key,w,h);
  const c = t.context;
  c.imageSmoothingEnabled = false;
  const box = (color,x,y,w,h) => { c.fillStyle=color; c.fillRect(x|0,y|0,w|0,h|0); };
  const poly = (color,points) => {
    c.fillStyle=color; c.beginPath();
    points.forEach(([x,y],i)=> i ? c.lineTo(x,y) : c.moveTo(x,y));
    c.closePath(); c.fill();
  };
  paint(c,box,poly);
  t.refresh();
}

export function landscape(scene) {
  texture(scene,'sky',690,300,(c,b,p)=>{
    const rng=random(29);
    const colors=['#16142e','#231b41','#36234f','#623566','#9d4c76','#df797e','#f4a58b','#ad648c'];
    for(let y=0;y<300;y+=2){
      const pos=y/299*(colors.length-1), a=colors[Math.floor(pos)], d=colors[Math.ceil(pos)];
      const rgb=[1,3,5].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*(1-pos%1)+parseInt(d.slice(i,i+2),16)*(pos%1)));
      b('rgb('+rgb.join(',')+')',0,y,690,2);
    }
    for(let i=0;i<130;i++){
      const x=rng()*690,y=rng()*160;
      b(['#a17fae','#e8a7bc','#765b9c'][i%3],x,y,1,1);
      if(i%13===0){b('#ffe0bd',x-2,y,5,1);b('#ffe0bd',x,y-2,1,5);}
    }
    for(let y=-31;y<=31;y++){
      const w=Math.sqrt(32*32-y*y)|0;
      b(y<8?'#ffd4a6':'#ffb991',530-w,40+y,w*2,1);
    }
    for(let i=0;i<21;i++){
      const x=505+rng()*48,y=20+rng()*40;
      if(Math.hypot(x-530,y-40)<23)b('#f3a58e',x,y,2+rng()*6,2);
    }
    for(const [x,y,w] of [[85,65,75],[333,94,91],[505,62,91],[620,95,70],[201,115,67]]){
      for(let i=0;i<13;i++){
        const dx=i/13*w; const height=4+rng()*12;
        b('#74466e',x+dx,y-height,w/11+4,height+5);
        b('#a35e82',x+dx,y+1,w/11+4,2);
      }
    }
  });
  texture(scene,'hills',760,150,(c,b,p)=>{
    const rng=random(112);
    for(let layer=0;layer<3;layer++){
      const base=65+layer*24;
      const mids=[];
      for(let x=-40;x<810;x+=44)mids.push([x,base-rng()*(47-layer*9)]);
      p(['#63517b','#4b3b68','#352d58'][layer],[...mids,[810,151],[-40,151]]);
      mids.slice(0,-1).forEach(([x,y],i)=>p(['#81618a','#655078','#44355e'][layer],[[x,y],[mids[i+1][0],mids[i+1][1]],[x+27,base+24]]));
    }
    for(let x=0;x<760;x+=6){
      const h=7+rng()*30,y=131-h;
      b('#2a234a',x,y,5,h+19);
      for(let k=y+4;k<132;k+=5)if(rng()>.46)b(rng()>.5?'#dd947f':'#a17199',x+2,k,1,2);
    }
  });
  texture(scene,'sakura',144,190,(c,b,p)=>{
    const rng=random(603);
    p('#261735',[[0,181],[11,176],[25,135],[32,114],[58,85],[67,84],[42,113],[37,142],[25,190],[0,190]]);
    p('#53304b',[[7,188],[25,139],[37,124],[27,152],[20,187]]);
    p('#37223e',[[25,140],[20,110],[3,88],[7,84],[28,108],[33,130],[68,112],[94,84],[101,86],[76,118],[37,146]]);
    p('#3c2542',[[47,101],[44,72],[18,43],[24,37],[53,68],[55,92],[83,67],[89,45],[97,47],[93,73],[61,100]]);
    const clusters=[[0,30,32],[27,47,34],[61,26,37],[90,45,32],[114,25,26],[13,74,25],[82,78,18],[43,9,28],[126,59,14]];
    for(const [x,y,r] of clusters){
      for(let i=0;i<110;i++){
        const a=rng()*6.28,d=Math.sqrt(rng())*r,xx=x+d*Math.cos(a),yy=y+d*Math.sin(a)*.62;
        b(['#543056','#7b3c69','#ad537e','#d96d96','#fa91ad','#ffb1be','#ffd2c9'][Math.floor(rng()*7)],xx,yy,2+rng()*5,1+rng()*4);
      }
    }
  });
}

export function island(scene,key,w,seed){
  texture(scene,key,w,70,(c,b,p)=>{
    const rng=random(seed);
    p('#21162f',[[0,3],[w,3],[w-11,24],[w*.7,42],[w*.52,69],[w*.33,54],[9,27]]);
    for(let x=3;x<w-3;x+=4){
      const length=57*(1-Math.abs(x-w*.52)/(w*.55))+rng()*7;
      p(['#52315a','#723e62','#8e5068','#ac636e','#3d274f'][Math.floor(rng()*5)],[[x,7],[x+7,6],[x+5,18],[w*.52+(x-w*.52)*.46,9+length],[x-1,22]]);
    }
    for(let y=12;y<45;y+=4)for(let x=12;x<w-12;x+=4)if(rng()<.16&&y<47-55*Math.abs(x/w-.5)) b('#bd7476',x,y,2,1);
    b('#514247',0,0,w,7);b('#6b773a',0,0,w,4);b('#c1be57',2,0,w-4,2);
    for(let x=2;x<w-2;x+=2){
      b(['#ddcf72','#9b9f48','#777b39','#a6af52'][Math.floor(rng()*4)],x,0,2,2+rng()*7);
      if(rng()<.18){b('#5f793d',x,-1,1,5);b('#ffc0ac',x-1,0,3,1);}
    }
  });
}

export function arch(scene,world){
  texture(scene,world.id+'-arch',94,105,(c,b,p)=>{
    const rng=random(54);
    const hue=world.palette;
    const theme={crown:['#401d68','#ab61cd','#613687'],rain:['#13294f','#5b97cf','#234977'],duck:['#522c31','#d89551','#784750'],bouquet:['#542343','#bd587a','#803857'],locked:['#30273c','#776683','#554962']}[world.animation]||['#352651','#876caf','#55406b'];
    const edge=(x,y)=> y<46?Math.hypot(x-47,y-46):Math.abs(x-47);
    for(let y=3;y<98;y++)for(let x=2;x<92;x++){
      const d=edge(x,y);
      if(d>44||y>94&&d>41)continue;
      let col=theme[0];
      if(d>41) col='#281b3a';
      else if(d>39) col=theme[1];
      else if(d>37) col=hue;
      else if(d>32) col=((y<46?Math.atan2(y-46,x-47)*30:y)%9<1)?theme[2]:theme[1];
      else if(d>30) col=hue;
      else if(d>29) col=theme[2];
      b(col,x,y,1,1);
    }
    for(let i=0;i<56;i++){
      const x=20+rng()*54,y=22+rng()*68;
      if(edge(x,y)<26)b(i%3?hue:theme[1],x,y,1,1);
    }
    if(world.animation==='crown'){
      for(const [x,y,w,h] of [[24,63,12,27],[37,57,20,33],[58,66,12,24],[43,46,8,30]]){
        b(theme[2],x,y,w,h);p(theme[1],[[x-2,y],[x+w/2,y-9],[x+w+2,y]]);b(hue,x+w/2,y+4,2,4);
      }
      b('#ffda83',50,39,7,3);
    }
    if(world.animation==='rain'){
      for(let i=0;i<23;i++){const x=21+rng()*50,y=49+rng()*39;b('#4979ab',x,y,1,4);}
      b('#7d4b56',30,75,34,4);b('#bb766d',28,81,38,3);b('#322648',32,84,3,7);b('#322648',58,84,3,7);
      p(hue,[[53,45],[42,59],[49,59],[43,70],[56,56],[50,56]]);
    }
    if(world.animation==='duck'){
      c.strokeStyle=hue;c.lineWidth=2;c.beginPath();c.arc(47,67,15,0,7);c.stroke();
      b(hue,46,55,2,13);b(hue,46,67,9,2);
    }
    if(world.animation==='bouquet'){
      p(hue,[[47,82],[30,66],[30,60],[36,55],[42,55],[47,60],[52,55],[58,55],[64,60],[64,66]]);
      p('#ffe0dd',[[47,76],[34,64],[36,59],[42,59],[47,65],[52,59],[58,59],[60,64]]);
    }
    if(!world.enabled){
      for(let y=50;y<90;y+=12){b('#77566d',19,y,56,6);for(let x=20;x<72;x+=10)b('#bd9575',x,y+1,4,3);}
    }
    for(const x of [3,74]){
      b('#261933',x,43,17,9);b(theme[1],x+2,44,13,6);b(hue,x+3,44,11,2);
      b(theme[2],x+2,90,13,10);b(hue,x+2,91,13,2);
    }
    b(theme[2],32,94,30,6);b(hue,36,95,22,2);
  });
}

export function hero(scene) {
  texture(scene,'hero-sheet',40*8,48*10,(c,b,p)=>{
    for(let row=0;row<10;row++)for(let i=0;i<8;i++){
      c.save();c.translate(i*40,row*48);
      const gait=[1,2,9].includes(row), stride=gait?[0,2,4,2,0,-2,-4,-2][i]:0;
      const dy=row===3?-3:row===4?1:Math.abs(stride)>2?1:0;
      for(const side of [-1,1]){
        const x=side===1?22:12, dx=side*stride+(row===3?side*2:0), lift=side*stride<0?3:0;
        p('#29243c',[[x-1,33],[x+7,33],[x+dx+7,44-lift],[x+dx-2,44-lift]]);
        b('#4a425a',x+dx,37-lift,5,6);b('#201729',x+dx-2,43-lift,10,4);b('#e78c9e',x+dx-1,45-lift,8,1);
      }
      c.translate(0,dy);
      for(const side of [-1,1]){
        const raise=row===5?7+i%3:row===3?5:0, x=side===1?28:7, y=25-raise+side*stride/2;
        b('#261c33',x-1,y,6,12);b('#676578',x,y+1,4,7);b('#dba385',x,y+8,4,3);
      }
      p('#221c32',[[13,22],[27,22],[31,27],[29,37],[11,37],[10,27]]);
      p('#5a5a70',[[13,24],[27,24],[29,27],[27,36],[13,36],[11,27]]);
      b('#858098',13,25,4,10);b('#44465b',24,25,4,10);
      for(const [x,y] of [[13,28],[17,25],[20,31],[24,27],[14,34],[25,34]]){
        b('#ece0d4',x,y,3,1);b('#cbbec5',x+1,y-1,1,3);
      }
      b('#bca2a9',20,26,1,10);
      p('#281c30',[[12,5],[17,2],[25,2],[31,6],[32,16],[28,23],[24,26],[16,24],[10,19],[9,10]]);
      p('#d2a087',[[13,8],[27,6],[30,11],[29,19],[25,23],[16,21],[12,17]]);
      p('#6d4550',[[11,12],[14,13],[14,18],[18,20],[22,18],[28,17],[30,13],[30,20],[26,24],[22,26],[16,24],[12,21]]);
      b('#986555',17,21,2,2);b('#ac7563',22,22,3,2);b('#d89479',24,19,3,1);
      b('#422b36',17,12,4,1);b('#422b36',25,11,3,1);
      b('#332737',18,14,2,row===7||i===6?1:2);b('#332737',26,13,2,row===7||i===6?1:2);
      b('#efb693',23,15,2,2);
      p('#a13969',[[11,6],[15,3],[25,2],[30,5],[32,9],[30,13],[27,8],[20,8],[15,11],[12,16],[10,13]]);
      p('#eb729b',[[11,7],[16,3],[25,3],[29,5],[28,7],[23,6],[17,9],[12,12]]);
      b('#ffa3b4',16,4,7,1);b('#ff99b4',12,7,5,1);
      if(row===6){b('#79d9ff',18,16+i%5,1,4);b('#b5ecff',26,15+(i+2)%5,1,4);}
      if(row===7){b('#d5b5e9',30,4-i%4,5,1);b('#d5b5e9',32,5-i%4,1,2);b('#d5b5e9',29,7-i%4,5,1);}
      if(row===8){p('#729658',[[28,23],[36,23],[30,36]]);for(const [x,y] of [[27,22],[32,19],[35,23]]){b('#ff87b4',x,y,5,3);b('#ffdad1',x+2,y-1,2,4);}}
      if(row===9){b('#e8a34b',30,29,9,5);b('#ffda76',34,25,5,6);b('#38223a',36,26,2,1);b('#ee824f',38,28,2,2);}
      c.restore();
    }
  });
  scene.textures.addSpriteSheet('hero',scene.textures.get('hero-sheet').getSourceImage(),{frameWidth:40,frameHeight:48});
}
