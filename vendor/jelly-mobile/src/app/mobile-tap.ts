// MoYa adaptation, 2026-10-22. GPL-3.0-only.
export class TapGesture {
  private active=new Map<number,{x:number;y:number;time:number;moved:boolean}>();
  begin(id:number,x:number,y:number,time:number) {
    const multiple=this.active.size>0;
    if(multiple)for(const value of this.active.values())value.moved=true;
    this.active.set(id,{x,y,time,moved:multiple});
  }
  move(id:number,x:number,y:number) {
    const v=this.active.get(id);
    if(v&&Math.hypot(x-v.x,y-v.y)>8)v.moved=true;
  }
  end(id:number,x:number,y:number,time:number) {
    this.move(id,x,y);const v=this.active.get(id);this.active.delete(id);
    return !!v&&!v.moved&&time-v.time<=300;
  }
  cancel(){this.active.clear();}
}
