/*(function(){
  document.head.insertAdjacentElement(`beforeend`,Object.assign(document.createElement('script'),{src:`https://cdn.jsdelivr.net/particles.js/2.0.0/particles.min.js`}));
  document.body.insertAdjacentHTML(`afterbegin`,`<div id="particles-js-el" style="position:fixed;top:0;left:0;right:0;bottom:0;z-index:2;pointer-events:none;"></div>`);
  setTimeout(()=>particlesJS?particlesJS('particles-js-el',{
    particles:{
      number:{value:200,density:{enable:true,value_area:800}},
      color:{value:'#ffffff'},
      shape:{type:'image',stroke:{width:3,color:'#fff'},polygon:{nb_sides:5},image:{src:`https://mypanty1.github.io/snow/snowflake3-min.png`,width:100,height:100}},
      opacity:{value:1,random:false,anim:{enable:false,speed:1,opacity_min:0.1,sync:false}},
      size:{value:10,random:true,anim:{enable:false,speed:20,size_min:1,sync:false}},
      line_linked:{enable:false,distance:50,color:'#ffffff',opacity:0.6,width:1},
      move:{enable:true,speed:4,direction:'bottom',random:true,straight:false,out_mode:'out',bounce:false,attract:{enable:true,rotateX:300,rotateY:1200}}
    },
    interactivity:{
      detect_on:'canvas',
      events:{onhover:{enable:true,mode:'bubble'},onclick:{enable:true,mode:'repulse'},resize:true},
      modes:{grab:{distance:150,line_linked:{opacity:1}},bubble:{distance:200,size:40,duration:2,opacity:8,speed:3},repulse:{distance:200,duration:0.2},push:{particles_nb:4},remove:{particles_nb:2}}
    },
    retina_detect:true
  }):null,1000);
}())*/




Vue.component('SiteAdd',{
  template:`<div name="SiteAdd" class="display-content">
    <link-block :actionIcon="open?'up':'down'" icon="card" text="Дополнительно" type="large" @block-click="open=!open" class="my-m8---"/>
    <div v-show="open" class="margin-left-right-16px">
      <loader-bootstrap v-if="loading" text="загрузка данных по дому"/>
      <div v-else class="site-add-table">
        <div bb tac>Услуга</div><div bb tac>активен</div><div bb tac>отключен</div><div bb tac>всего</div>
        <template v-for="({title,icon,active=0,inactive=0,all=0},index) of rows">
          <template v-if="index==rows.length-1">
            <div bb></div><div bb></div><div bb></div><div bb></div>
          </template>
          <div class="display-flex align-items-center gap-2px">
            <span class="ic-16 tone-500" :class="'ic-'+icon"></span>
            <div class="white-space-pre">{{title}}</div>
          </div>
          <div tac>{{!all?active:''}}</div>
          <div tac>{{!all?inactive:''}}</div>
          <div tac>{{!all?(active+inactive):all}}</div>
        </template>
      </div>
    </div>
    <!--<devider-line/>-->
  </div>`,
  props:{
    entrances:{type:Array,default:()=>([]),required:true},
    entrance_id:{type:String,default:''},
    loading:{type:Boolean,default:false},
  },
  data:()=>({
    open:false,
    services:{
      1  :{title:'ШПД',     icon:'eth'},
      4  :{title:'ТВ КТВ',  icon:'tv'},
      2  :{title:'ТВ DVB-C',icon:'tv'},
      16 :{title:'ТВ IPTV', icon:'tv'},
      8  :{title:'Тлф VoIP',icon:'phone-1'},
      acc:{title:'Абоненты',icon:'ls'},
    }
  }),
  computed:{
    rows(){
      return Object.entries(this.counters).map(([_id,counters])=>({
        active:0,inactive:0,all:0,...counters,
        ...this.services[_id]||{title:`![${_id}]`,icon:'warning'}
      }));
    },
    counters(){
      const entrance=this.entrances.find(({id})=>id==this.entrance_id);
      return (entrance?[entrance]:this.entrances).reduce((counters,{floor})=>{
        (floor||[]).forEach(({flats})=>{
          (flats||[]).forEach(({subscribers})=>{
            (subscribers||[]).forEach(({services})=>{
              (services||[]).forEach(({service_id,status})=>{
                if(!counters[service_id]){counters[service_id]={active:0,inactive:0}};
                counters[service_id][status==='green'?'active':'inactive']++;
              });
              counters.acc.all++;
            });
          });
        });
        return counters;
      },{
        acc:{all:0},
      });
    },
  },
});


