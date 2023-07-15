Vue.component("PortsMapLogsPortLinkEventsChart",{
  template:`<div name="PortsMapLogsPortLinkEventsChart">
    <div class="display-flex align-items-center justify-content-space-between">
      <span class="font--12-400">{{port.snmp_name||''}}</span>
      <span class="font--12-400">{{linkDownCounterText||''}}</span>
    </div>
    <div class="display-flex align-items-center flex-direction-row-reverse" :style="{background:bg}">
      <div v-for="(item,index) of items" :key="index" :style="item.style" :title="item.date||''" class="min-height-20px"></div>
    </div>
  </div>`,
  props:{
    events:{type:Array,default:()=>[]},
    dateMax:{type:Object,default:null},
    dateMin:{type:Object,default:null},
    port:{type:Object,default:()=>({})},
  },
  data:()=>({}),
  computed:{
    bg(){return PORT_LINK_LOGS.chart.bg},
    total(){
      const {dateMin,dateMax}=this;
      if(!dateMin||!dateMax){return 0};
      return dateMax.time-dateMin.time;
    },
    countLinkDown(){return this.events.filter(({state})=>!state).length},
    linkDownCounterText(){return !this.countLinkDown?'':`${this.countLinkDown} ${plural(['падение','падения','падений'],this.countLinkDown)} линка`},
    items(){
      const {total}=this;
      if(!total){return []};
      const percent=total/100;
      const {dateMin:{time:timeMin},dateMax:{time:timeMax}}=this;
      const {bgLinkUp,bgLinkDn}=PORT_LINK_LOGS.chart;
      class Item {
        constructor(state,time=0,date='',duration=0,percent=1){
          const percentWidth=duration/percent;
          this.state=state
          this.time=time//for prev
          this.date=date//to title
          this.style={
            width:`${percentWidth}%`,
            background:state?bgLinkUp:bgLinkDn,
          }
          //if(percentWidth<0.5){
          //  this.style['border-left']=`1px solid ${!state?bgLinkUp:bgLinkDn}`;
          //}
        }
      }
      return this.events.reduce((items,event,index,events)=>{
        if(!index){
          //const time=Date.now();
          //const date=new Date(time).toLocaleString();
          //const duration=time-event.time//timeMax;
          //items.push(new Item(event.state,time,'curr_'+date,duration,percent));
          const duration=timeMax-event.time;
          const date=new Date(timeMax).toLocaleString();
          items.push(new Item(event.state,timeMax,'new_'+date,duration,percent));
        };
        
        const newest=items[index-1]//||new Item(state,timeMax);
        if(newest){
          const duration=newest.time-event.time;
          items.push(new Item(event.state,event.time,event.date,duration,percent));
        };
        
        if(index==events.length-1){
          const newest=items[items.length-1];
          if(newest){
            const duration=newest.time-timeMin;
            const date=new Date(timeMin).toLocaleString();
            items.push(new Item(!newest.state,timeMin,'old_'+date,duration,percent));
          }
        };
        return items;
      },[]);
    }
  },
  methods:{}
});
