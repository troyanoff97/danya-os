import Phaser from 'phaser';
import './style.css';
import {worlds} from './worlds.js';
import {contacts} from './contacts.js';
import animations from './animations.json';
import {arch, hero, island, landscape,random} from './art.js';
import {AudioGarden} from './audio.js';

const stage=document.querySelector('#stage'), status=document.querySelector('#status');
const sound=document.querySelector('#sound'), dialog=document.querySelector('dialog');
const audio=new AudioGarden(), reduced=matchMedia('(prefers-reduced-motion: reduce)');
const slots=[...worlds.slice(0,2),null,...worlds.slice(2)].map((world,index)=>({
  world,x:70+110*index,y:[191,170,204,170,191,207][index%6],width:92
}));
const spawn=slots[2], width=slots.at(-1).x+70, gravity=540, jump=238, speed=174;
const defaultStatus='Выбери портал или прогуляйся по саду';
const keys={ArrowLeft:'left',a:'left',ф:'left',ArrowRight:'right',d:'right',в:'right',ArrowUp:'jump',w:'jump',ц:'jump',' ':'jump',Enter:'enter',e:'enter',у:'enter'};
const poses={crown:'cheer',rain:'cry',duck:'duck',bouquet:'bouquet'};
let scene;

function destination(world){
  if(world.url){location.assign(world.url);return;}
  dialog.querySelector('h2').textContent=world.title;
  if(!dialog.open)dialog.showModal();
}
function refreshSound(){
  sound.setAttribute('aria-pressed',audio.enabled);
  sound.querySelector('span').textContent=audio.enabled?'Звук вкл.':'Звук выкл.';
}
refreshSound();
sound.onclick=()=>{audio.toggle();refreshSound();};
function unlockOnInteraction(event) {
  if (!sound.contains(event.target)) audio.unlock();
}
for(const world of worlds){
  const card=document.createElement('article');
  card.className='card'; card.style.setProperty('--accent',world.palette);
  const icon=document.createElement('span');
  icon.className='sigil';icon.textContent=world.icon;icon.setAttribute('aria-hidden','true');
  const name=document.createElement('button');name.textContent=world.title;
  name.disabled=!world.enabled;
  name.onclick=()=>{audio.unlock();stage.scrollIntoView({block:'nearest'});stage.focus({preventScroll:true});scene?.select(slots.find(slot=>slot.world===world),world);};
  const desc=document.createElement('small');desc.textContent=world.description;
  card.append(icon,name,desc);
  if(world.enabled){
    const link=document.createElement(world.url?'a':'button');
    link.textContent='Открыть сразу';
    if(world.url)link.href=world.url;
    else link.onclick=()=>destination(world);
    link.className='direct';card.append(link);
  }else card.setAttribute('aria-disabled','true');
  document.querySelector('#worlds').append(card);
}
document.querySelector('.section-title span').textContent=worlds.filter(world=>world.enabled).length+' приложения';

const contactLinks = document.querySelector('#contact-links');
if (contacts.length === 0) {
  const message = document.createElement('p');
  message.className = 'contact-empty';
  message.textContent = 'Контакты появятся здесь.';
  contactLinks.append(message);
}
for (const contact of contacts) {
  const link = document.createElement('a');
  link.className = 'contact-link';
  link.href = contact.href;
  const icon = document.createElement('span');
  icon.className = 'contact-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = contact.icon;
  const label = document.createElement('strong');
  label.textContent = contact.title;
  const value = document.createElement('span');
  value.className = 'contact-value';
  value.textContent = contact.value;
  link.append(icon, label, value);
  contactLinks.append(link);
}

class Garden extends Phaser.Scene {
  create(){
    scene=this;
    this.inputState=new Map();
    this.lastAction=null;
    this.mode='idle';
    this.clean=new AbortController();
    const signal=this.clean.signal;
    window.addEventListener('click',unlockOnInteraction,{signal});
    window.addEventListener('keydown',unlockOnInteraction,{signal});
    landscape(this);hero(this);
    this.sky=this.add.image(0,0,'sky').setOrigin(0).setScrollFactor(0);
    this.hills=this.add.tileSprite(0,0,width+20,150,'hills').setOrigin(0).setScrollFactor(0);
    this.tree=this.add.image(-5,3,'sakura').setOrigin(0).setDepth(0);
    this.treeRight=this.add.image(width+4,149,'sakura').setOrigin(0).setFlipX(true).setScale(.64);
    this.ground=this.physics.add.staticGroup();
    slots.forEach((slot,i)=>{
      const {x,y,world}=slot;
      const floor=this.add.rectangle(x,y+4,slot.width,8).setVisible(false);
      this.ground.add(floor);
      island(this,'rock'+i,slot.width,54+i*13);
      this.add.image(x,y,'rock'+i).setOrigin(.5,0).setDepth(2);
      if(!world)return;
      arch(this,world);
      slot.arch=this.add.image(x,y+3,world.id+'-arch').setOrigin(.5,1).setDepth(1);
      this.add.rectangle(x,y-73,world.title.length>6?68:55,16,0x21152e,.78).setDepth(2);
      this.add.text(x,y-73,world.enabled?world.title:'В РАБОТЕ',{
        fontFamily:'"Press Start 2P", monospace', fontSize:world.title.length>6?'7px':'8px',
        color:'#fff0eb', stroke:'#211730', strokeThickness:2
      }).setOrigin(.5).setDepth(2);
      this.add.text(x,y+11,world.icon,{
        fontFamily:'monospace',fontSize:'10px',color:world.palette
      }).setOrigin(.5).setDepth(3);
    });
    this.edges=new Map(slots.map((from,i)=>[from,slots.filter((to,j)=>{
      if(Math.abs(i-j)!==1)return false;
      const t=this.flight(from,to);
      return Number.isFinite(t)&&Math.abs(to.x-from.x)/t<=speed;
    })]));
    Object.entries(animations.animations).forEach(([key,anim])=>{
      this.anims.create({key,...anim,frames:anim.frames.map(frame=>({key:'hero',frame}))});
    });
    ['cry','sleep','bouquet','duck'].forEach((key,i)=>this.anims.create({
      key,frames:this.anims.generateFrameNumbers('hero',{start:48+8*i,end:55+8*i}),frameRate:9,repeat:-1
    }));
    this.player=this.physics.add.sprite(spawn.x,spawn.y-24,'hero').setDepth(4);
    this.player.body.setSize(16,39).setOffset(12,9);
    this.physics.add.collider(this.player,this.ground,null,(player,floor)=>
      player.body.velocity.y>=0 && player.body.prev.y+player.body.height <= floor.body.top+3);
    this.scenery=this.add.graphics().setDepth(3);
    this.effects=this.add.graphics().setDepth(6);
    const rng=random(64);
    this.petals=Array.from({length:41},()=>[rng()*width,rng()*275,5+rng()*13,rng()*7]);
    this.scale.on('resize',this.layout,this);
    this.layout();
    this.input.on('pointerdown',pointer=>{
      if(dialog.open)return;
      audio.unlock();
      stage.focus({preventScroll:true});
      const point=this.cameras.main.getWorldPoint(pointer.x,pointer.y);
      const slot=slots.find(p=>Math.abs(point.x-p.x)<=p.width/2&&point.y>=p.y-(p.world?105:10)&&point.y<=p.y+24);
      if(slot?.world&&!slot.world.enabled){status.textContent=slot.world.description;return;}
      if(slot)this.select(slot,point.y<slot.y-5?slot.world:null,point.x);
    });
    window.addEventListener('keydown',event=>{
      const key=keys[event.key.toLowerCase()]||keys[event.key];
      if(!key||dialog.open||event.metaKey||event.ctrlKey||event.altKey)return;
      if(event.target.closest('button,a,input,textarea,select'))return;
      event.preventDefault();
      if(!event.repeat){audio.unlock();this.press(event.code,key);}
    },{signal});
    window.addEventListener('keyup',event=>this.inputState.delete(event.code),{signal});
    for(const button of document.querySelectorAll('[data-key]')){
      button.addEventListener('pointerdown',e=>{
        e.preventDefault();button.setPointerCapture(e.pointerId);audio.unlock();
        this.press(e.pointerId,button.dataset.key);
      },{signal});
      for(const event of ['pointerup','pointercancel','lostpointercapture']){
        button.addEventListener(event,e=>this.inputState.delete(e.pointerId),{signal});
      }
      button.addEventListener('click',e=>{
        if(e.detail===0){this.press('accessible',button.dataset.key);this.time.delayedCall(170,()=>this.inputState.delete('accessible'));}
      },{signal});
    }
    window.addEventListener('blur',()=>this.inputState.clear(),{signal});
    window.addEventListener('pageshow',e=>{if(e.persisted)this.resetEntry();},{signal});
    document.addEventListener('visibilitychange',()=>{
      if(document.hidden){this.inputState.clear();audio.pause();this.scene.pause();}
      else{this.scene.resume();audio.unlock();}
    },{signal});
    dialog.addEventListener('close',()=>{this.resetEntry();stage.focus({preventScroll:true});},{signal});
    this.events.once('shutdown',()=>{this.clean.abort();this.scale.off('resize',this.layout,this);audio.pause();});
  }
  layout(){
    const {width:w,height:h}=this.scale;
    const zoom=w<700?Math.max(1,h/255):Math.min(w/width,h/248);
    this.cameras.main.setZoom(zoom).roundPixels=true;
    this.sky.setScale(Math.max(w/zoom/690,h/zoom/300));
    this.hills.setSize(w/zoom,150);
  }
  flight(a,b){
    return (jump+Math.sqrt(jump*jump+2*gravity*(b.y-a.y)))/gravity;
  }
  route(from,to){
    const queue=[[from]], visited=new Set([from]);
    for(const path of queue){
      const last=path.at(-1);
      if(last===to)return path.slice(1);
      for(const next of this.edges.get(last)||[]){
        if(!visited.has(next)){visited.add(next);queue.push([...path,next]);}
      }
    }
    return null;
  }
  select(slot,world,x=slot.x,roam=false){
    if(this.mode==='entering'||this.mode==='recovery')return;
    this.target={slot,world,x:world?slot.x:Phaser.Math.Clamp(x,slot.x-36,slot.x+36),roam};
    this.lastAction=this.time.now;
    this.mode='navigating';
    if(!roam){status.textContent=world?'На пути к порталу «'+world.title+'»':'Иду к выбранной точке';audio.effect('select');}
  }
  press(id,key){
    if(this.mode==='entering'||this.mode==='recovery'||dialog.open)return;
    this.inputState.set(id,key);
    this.target=null;this.air=null;this.mode='manual';this.lastAction=this.time.now;
    status.textContent=defaultStatus;
    if(key==='jump')this.jumpUntil=this.time.now+125;
    if(key==='enter'){
      const slot=this.platform();
      if(slot?.world?.enabled&&Math.abs(slot.x-this.player.x)<36)this.enter(slot.world);
      else status.textContent='Подойди ближе к открытому порталу';
    }
  }
  platform(){
    const {body,x}=this.player;
    if(!body.blocked.down)return null;
    return slots.find(p=>Math.abs(p.y-body.bottom)<3&&Math.abs(p.x-x)<p.width/2+8);
  }
  leap(v){
    this.player.setVelocity(v,-jump);
    audio.effect('jump');
  }
  resetEntry(){
    this.mode='idle';this.target=null;this.entry=null;this.lastAction=this.time.now;status.textContent=defaultStatus;
  }
  enter(world){
    this.target=null;this.air=null;this.mode='entering';this.inputState.clear();
    this.entry={world,time:this.time.now};
    this.player.setVelocity(0,0);
    this.player.anims.play(poses[world.animation]||'cheer');
    audio.effect(world.animation);
    status.textContent='Открывается портал «'+world.title+'»';
    this.time.delayedCall(reduced.matches?480:1050,()=>{
      if(this.entry?.world!==world)return;
      destination(world);
      if(world.url)this.time.delayedCall(1800,()=>this.resetEntry());
    });
  }
  update(time){
    this.lastAction??=time;
    const p=this.player, camera=this.cameras.main;
    const viewWidth=this.scale.width/camera.zoom, viewHeight=this.scale.height/camera.zoom;
    const center=viewWidth>=width?width/2:Phaser.Math.Clamp(p.x,viewWidth/2,width-viewWidth/2);
    camera.centerOn(center,139);
    const left=(this.scale.width-viewWidth)/2, top=(this.scale.height-viewHeight)/2;
    const skyOffset=Phaser.Math.Clamp(viewWidth*.77-530*this.sky.scaleX,viewWidth-this.sky.displayWidth,0);
    this.sky.setPosition(left+skyOffset,top);
    this.hills.setPosition(left,top+viewHeight-150).setTilePosition((center-width/2)*.25+(reduced.matches?0:time*.003),0);
    if(p.y>365){
      this.air=null;this.target=null;this.mode='recovery';this.inputState.clear();this.jumpUntil=0;
      status.textContent='Возвращаюсь в сад…';
      p.body.reset(spawn.x,spawn.y-24);
      this.time.delayedCall(340,()=>this.resetEntry());
    }
    const platform=this.platform(), grounded=Boolean(platform);
    if(grounded&&!this.wasGrounded&&time>400)audio.effect('land');
    this.wasGrounded=grounded;
    let vx=p.body.velocity.x;
    if(this.mode==='entering'||this.mode==='recovery')vx=0;
    else if(this.target){
      const target=this.target;
      if(time-this.lastAction>12500){this.target=null;this.air=null;vx=0;this.resetEntry();}
      else if(platform){
        this.air=null;
        const route=this.route(platform,target.slot);
        if(!route){this.resetEntry();vx=0;}
        else if(route.length){
          const dx=platform.x-p.x;
          if(Math.abs(dx)>3)vx=Phaser.Math.Clamp(dx*14,-speed,speed);
          else {
            const next=route[0], t=this.flight(platform,next);
            vx=(next.x-p.x)/t;this.air={vx,next};this.leap(vx);
          }
        }else{
          const dx=target.x-p.x;
          vx=Math.abs(dx)>2?Phaser.Math.Clamp(dx*14,-speed,speed):0;
          if(!vx){
            if(target.world)this.enter(target.world);
            else this.resetEntry();
          }
        }
      }else if(this.air)vx=this.air.vx;
    }else{
      const active=[...this.inputState.values()];
      vx=(Number(active.includes('right'))-Number(active.includes('left')))*speed;
      if(this.jumpUntil>=time&&grounded){this.jumpUntil=0;this.leap(vx);}
      if(active.length)this.lastAction=time;
      if(grounded&&!active.length&&time-this.lastAction>17000&&!reduced.matches&&!dialog.open){
        const next=platform===spawn?slots[Math.floor(time/1000)%2?1:3]:spawn;
        this.select(next,null,next.x,true);
      }
    }
    p.setVelocityX(vx);
    if(vx)p.setFlipX(vx<0);
    if(this.mode!=='entering'){
      const key=!grounded?(p.body.velocity.y<0?'jump':'fall'):Math.abs(vx)>140?'run':Math.abs(vx)>2?'walk':time-this.lastAction>10500?'sleep':'idle';
      if(p.anims.currentAnim?.key!==key)p.anims.play(key);
    }
    this.decorate(reduced.matches?0:time,time);
  }
  decorate(time,clock){
    const s=this.scenery; s.clear();
    for(const slot of slots){
      for(const side of [-1,1]){
        const x=slot.x+side*40, y=slot.y;
        s.fillStyle(0x405437).fillRect(x,y-5,1,5).fillRect(x-2,y-3,5,1);
        s.fillStyle(side===1?0xff94ba:0xffc58d).fillRect(x-2,y-7,5,2).fillRect(x,y-8,1,4);
        s.fillStyle(0xffe2ba).fillRect(x,y-6,1,1);
      }
    }
    const catX=spawn.x-32, catY=spawn.y-2;
    s.fillStyle(0x44324b).fillRect(catX-3,catY-3,19,5);
    s.fillStyle(0xe4bdbc).fillRect(catX,catY-6,12,7).fillRect(catX+10,catY-8,7,8);
    s.fillRect(catX+10,catY-10,2,3).fillRect(catX+15,catY-10,2,3);
    s.fillStyle(0x68465d).fillRect(catX+12,catY-5,3,1);
    const duckX=spawn.x+32, duckY=spawn.y-3-Math.round(Math.sin(time*.006));
    s.fillStyle(0xdb8f53).fillRect(duckX-4,duckY-2,11,5);
    s.fillStyle(0xffcd73).fillRect(duckX-4,duckY-4,10,5).fillRect(duckX+2,duckY-8,6,7);
    s.fillStyle(0x3c2c45).fillRect(duckX+5,duckY-7,2,1);
    s.fillStyle(0xff9864).fillRect(duckX+7,duckY-5,3,2);
    const g=this.effects;g.clear();
    for(const [x,y,v,seed] of this.petals){
      const xx=(x+(reduced.matches?0:time*.012+Math.sin(time*.001+seed)*9))%width;
      const yy=(y+(reduced.matches?0:time*v*.001))%274;
      g.fillStyle(seed>3?0xffa9c1:0xffd1ae,.68).fillRect(Math.floor(xx),Math.floor(yy),2,1);
    }
    const selected=this.target?.world||this.entry?.world;
    for(const slot of slots){
      if(!slot.world)continue;
      if(slot.world.animation==='rain'){
        g.fillStyle(0x96c5ed,.55);
        for(let i=0;i<12;i++){
          const phase=(time*.026+i*17)%34;
          g.fillRect(slot.x-23+(i*13)%47-phase*.14,slot.y-43+phase,1,2);
        }
      }
      if(slot.world.animation==='bouquet'){
        g.fillStyle(0xff9ab9,.7);
        for(let i=0;i<6;i++){
          const phase=(time*.018+i*11)%40;
          g.fillRect(slot.x-22+(i*17)%43+Math.sin(phase*.14)*3,slot.y-56+phase,2,1);
        }
      }
    }
    if(!selected)return;
    const slot=slots.find(s=>s.world===selected), color=Phaser.Display.Color.HexStringToColor(selected.palette).color;
    g.lineStyle(1,color,.8).strokeRect(slot.x-30,slot.y-110,60,3);
    if(!this.entry)return;
    const age=reduced.matches?0:clock-this.entry.time, origin=this.player;
    for(let i=0;i<16;i++){
      const theta=i*Math.PI/8;
      const r=12+age*.04;
      const vertical=selected.animation==='rain'?age*.055:selected.animation==='crown'?-age*.033:0;
      g.fillStyle(color,Math.max(.13,1-age/1150)).fillRect(origin.x+Math.cos(theta)*r,origin.y+Math.sin(theta)*r*.55+vertical,selected.animation==='rain'?1:3,selected.animation==='rain'?6:2);
    }
    if(selected.animation==='crown'){
      g.fillStyle(0xffd17c).fillRect(origin.x-8,origin.y-32,16,5).fillRect(origin.x-8,origin.y-37,4,6).fillRect(origin.x-2,origin.y-39,4,8).fillRect(origin.x+4,origin.y-37,4,6);
    }
  }
}

await document.fonts.load('9px "Press Start 2P"').catch(()=>{});
const game=new Phaser.Game({
  type:Phaser.CANVAS,parent:stage,width:stage.clientWidth,height:stage.clientHeight,
  pixelArt:true,backgroundColor:'#21142f',
  scale:{mode:Phaser.Scale.RESIZE},
  physics:{default:'arcade',arcade:{gravity:{y:gravity},fps:60}},
  audio:{noAudio:true},input:{activePointers:4,keyboard:false},scene:Garden
});
const observer=new ResizeObserver(()=>{
  if(stage.clientWidth&&stage.clientHeight)game.scale.resize(stage.clientWidth,stage.clientHeight);
});
observer.observe(stage);
window.addEventListener('pagehide',e=>{if(!e.persisted){observer.disconnect();game.destroy(true);}});
