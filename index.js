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
function tasksToState(state,tasks){
  for(const task of tasks){
    const {id,started_at,deadline}=task;
    const startMs=Date.parse(started_at);
    const deadlineMs=Date.parse(deadline)//+999999999;
    state.tasks[id]={
      ...task,
      startMs,
      deadlineMs,
      countdownRunning:false,
      countdownTimer:null,
      countdownMs:0
    };
  };
}
/*Vue.component("SiteNodePage2",{//fix bug
  template:`<section>
    <page-navbar :title="title" @refresh="refresh" />
    <card-block>
      <info-text :title="site.address" :text="site.name+' • '+site.node">
        <button-sq icon="pin" type="large" @click="toMap"/>
      </info-text>
    </card-block>
    <card-block>
      <title-main text="Устройства">
        <button-sq icon="refresh" type="large" @click="pingAll"/>
      </title-main>
      <devider-line />
      <loader-bootstrap v-if="loading.networkElements" text="загрузка данных по оборудованию"/>
      <template v-for="(networkElement,i) of networkElements">
        <devider-line v-if="i" class="mx-3"/>
        <device-info :ref="'device_info_'+networkElement.nioss_id" :networkElement="networkElement" showDisplayName hideEntrances/>
      </template>
      <message-el v-if="!loading.networkElements&&!networkElements?.length" text="Нет устройств" type="warn" class="margin-left-16px margin-right-16px" box/>
    </card-block>
    <site-info :site="site"/>
  </section>`,
  props: {
    siteProp: { type: Object, required: true },
  },
  data() {
    return {
      site: this.siteProp,
      loading: {
        networkElements: false
      },
      networkElements: [],
    };
  },
  created() {
    this.getNetworkElements();
  },
  computed:{
    title(){return `узел ОС типа ${this.site.type}`},
    device_info_refs(){
      return Object.keys(this.$refs).filter(key=>key.startsWith('device_info_')&&this.$refs[key][0]&&this.$refs[key][0].ping).map(key=>this.$refs[key][0]);
    },
  },
  methods: {
    pingAll(){
      this.device_info_refs.map(ref=>ref.ping());
    },
    refresh() {
      this.networkElements=[];
      this.getNetworkElements();
    },
    async getNetworkElements() {
      const params = { site_id: this.site.id };
      const url = buildUrl("devices", params, "/call/v1/device/");
      this.loading.networkElements = true;
      try {
        const response = await CustomRequest.get(url);
        if (Array.isArray(response)) {
          this.networkElements = response.filter((el) => el.uzel.name === this.site.node);
          this.networkElements=this.networkElements.map(networkElement=>({...networkElement,...{notAll:true}}));
        } else {
          throw new Error(response.message);
        }
      } catch (error) {
        console.warn("devices.error", error);
      }
      this.loading.networkElements = false;
    },
    toMap(){
      if(!this.site){return};
      this.$router.push({
        name:'map',
        query:{
          lat:this.site?.coordinates?.latitude,
          long:this.site?.coordinates?.longitude,
        },
      });
    },
  },
  beforeRouteEnter(to, from, next) {
    if (!to.params.siteProp) {
      next({
        name: "search",
        params: { text: to.params.id },
      });
      return;
    }
    next();
  },
});
app.$router.addRoutes([
  {
    path:'/site-node-2/:id',
    name:'site-node-2',
    component:Vue.component('SiteNodePage2'),
    props:true
  }
]);
app.$watch('$route',({name,params})=>{
  if(name==='site-node'){
    app.$router.replace({
      name: "site-node-2",
      params
    });
  };
});*/
