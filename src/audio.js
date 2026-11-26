const melody=[72,76,79,81,79,76,74,null,71,74,77,79,77,74,72,null,72,76,79,84,81,79,76,null,74,77,81,79,76,74,72,null];
const cues={jump:[60,72,79],land:[46,39],select:[72,76],crown:[60,64,67,72,79],rain:[72,69,65,62],duck:[55,51,55,51,72],bouquet:[69,76,81,83,88]};
export class AudioGarden {
  enabled=localStorage.getItem('danya-audio')!=='off';
  tick=0;
  note(midi,t,length,volume,type='triangle'){
    if(midi===null)return;
    const osc=this.context.createOscillator(), gain=this.context.createGain();
    osc.type=type;
    osc.frequency.value=440*2**((midi-69)/12);
    gain.gain.setValueAtTime(.0001,t);
    gain.gain.exponentialRampToValueAtTime(volume,t+.012);
    gain.gain.exponentialRampToValueAtTime(.0001,t+length);
    osc.connect(gain).connect(this.context.destination);osc.start(t);osc.stop(t+length+.02);
  }
  async unlock(){
    if(!this.enabled||document.hidden)return;
    this.context??=new AudioContext();
    try { await this.context.resume(); } catch { return; }
    if(!this.enabled||document.hidden||this.timer)return;
    this.timer=setInterval(()=>{
      const i=this.tick++%melody.length,t=this.context.currentTime+.02;
      this.note(melody[i],t,.15,.037,'square');
      if(i%4===0)this.note([48,45,41,43][Math.floor(i/8)],t,.33,.065);
    },177);
  }
  effect(name){
    if(!this.enabled||this.context?.state!=='running')return;
    const t=this.context.currentTime;
    cues[name]?.forEach((m,i)=>this.note(m,t+i*.072,.13,.075,name==='duck'?'sawtooth':'triangle'));
  }
  toggle(){
    this.enabled=!this.enabled;
    localStorage.setItem('danya-audio',this.enabled?'on':'off');
    if(this.enabled)this.unlock();else this.pause();
  }
  pause(){clearInterval(this.timer);this.timer=null;this.context?.suspend();}
}
