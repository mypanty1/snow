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
//name
document.head.appendChild(Object.assign(document.createElement('script'),{src:'https://mypanty1.github.io/snow/Fav.js',type:'text/javascript'}));

document.head.appendChild(Object.assign(document.createElement('script'),{src:'https://mypanty1.github.io/snow/SessionItem.js',type:'text/javascript'}));

document.head.appendChild(Object.assign(document.createElement('script'),{src:'https://mypanty1.github.io/snow/events-item.js',type:'text/javascript'}));
//SideBarExtModal
document.head.appendChild(Object.assign(document.createElement('script'),{src:'https://mypanty1.github.io/snow/SideBarExtModal.js',type:'text/javascript'}));
//percent
document.head.appendChild(Object.assign(document.createElement('script'),{src:'https://mypanty1.github.io/snow/PortsMapLogsPortLinkEventsChart.js',type:'text/javascript'}));
//ForisContent
document.head.appendChild(Object.assign(document.createElement('script'),{src:'https://mypanty1.github.io/snow/ForisContent.js',type:'text/javascript'}));
//SearchPageContent
document.head.appendChild(Object.assign(document.createElement('script'),{src:'https://mypanty1.github.io/snow/SearchPageContent.js',type:'text/javascript'}));
//AppHeader
document.head.appendChild(Object.assign(document.createElement('script'),{src:'https://mypanty1.github.io/snow/AppHeader.js',type:'text/javascript'}));









//далее временные правки для тестирования замены КД RKD_test_path

Vue.component('ChangeStagedNetworkElementsAdmStatus',{
  template:`<div name="ChangeStagedNetworkElementsAdmStatus">
    <loader-bootstrap v-if="stagesLoading||networkElementsLoading" text="получение замененных СЭ"/>
    <SectionBorder v-else class="display-flex flex-direction-column">
      <template v-for="({ne_name,ip,modelText,actionText,errorText},ne_id,index) of rows">
        <devider-line v-if="index" m="0"/>
        <title-main :text="ne_name" textClass="font--13-400" :textSub="actionText" textSubClass="font--12-400" class="padding-unset" :key="ne_id">
          <div class="display-flex margin-right-8px">
            <span class="ic-20" :class="getIconClass(ne_id)"></span>
          </div>
        </title-main>
        <message-el v-if="getError(ne_id)" :text="errorText" :subText="getError(ne_id)" box type="warn"/>
      </template>
    </SectionBorder>
  </div>`,
  props:{
    task_id:{type:String,required:true},
    site_id:{type:String,required:true},
  },
  data:()=>({}),
  async created(){
    const {task_id,site_id,key}=this;
    if(!this.getNetworkElementsBySiteId(site_id)&&!this.getSiteNetworkElementsLoads[site_id]){
      await this.getSiteNetworkElements({site_id});
    };
    if(!this.getRemedyResp('getRemedyWorkStages',task_id)&&!this.getRemedyLoad('getRemedyWorkStages',task_id)){
      await this.getRemedyWorkStages({task_id});
    };
    //this.changeStagedNetworkElementsAdmStatus({task_id,site_id,key});//RKD_test_path
  },
  computed:{
    ...mapGetters({
      getNetworkElementsBySiteId:'site/getNetworkElementsBySiteId',
      getSiteNetworkElementsLoads:'site/getSiteNetworkElementsLoads',
      getNiossLoad:'nioss/getLoad',
      getNiossResp:'nioss/getResp',
      getNiossError:'nioss/getError',
      getRemedyResp:'remedy/getResp',
      getRemedyLoad:'remedy/getLoad',
    }),
    key(){return atok('changeStagedNetworkElementsAdmStatus',this.task_id,this.site_id)},
    networkElementsLoading(){return this.getSiteNetworkElementsLoads[this.site_id]},
    stagesLoading(){return this.getRemedyLoad('getRemedyWorkStages',this.task_id)},
    stages(){return !this.stagesLoading?this.getRemedyResp('getRemedyWorkStages',this.task_id):null},
    networkElementsByName(){return Object.values(this.getNetworkElementsBySiteId(this.site_id)).reduce((nes,ne)=>({...nes,[ne.ne_name]:ne}),{})},
    rows(){
      const {networkElementsByName}=this;
      return this.stages.reduce((nes,stage)=>{
        const {new_device_name,old_device_name}=stage;
        const new_ne=networkElementsByName[new_device_name];
        if(new_ne){
          const {ne_id,ne_name,ip,vendor,model,sysObjectID}=new_ne;
          nes[ne_id]={
            ne_name,
            ip,
            modelText:getModelText(vendor,model,sysObjectID),
            actionText:'ввод СЭ в эксплуатацию',
            errorText:'Ошибка ввода СЭ в эксплуатацию',
          };
        };
        const old_ne=networkElementsByName[old_device_name];
        if(old_ne){
          const {ne_id,ne_name,ip,vendor,model,sysObjectID}=old_ne;
          nes[ne_id]={
            ne_name,
            ip,
            modelText:getModelText(vendor,model,sysObjectID),
            actionText:'перевод СЭ в демонтаж',
            errorText:'Ошибка перевода СЭ в демонтаж',
          };
        };
        return nes
      },{})
    },
  },
  methods:{
    ...mapActions({
      getSiteNetworkElements:'site/getSiteNetworkElements',
      getRemedyWorkStages:'remedy/getRemedyWorkStages',
      changeStagedNetworkElementsAdmStatus:'nioss/changeStagedNetworkElementsAdmStatus',
    }),
    getError(ne_id){
      return this.getNiossError(this.key)?.[ne_id]
    },
    getIconClass(ne_id){
      if(!ne_id){return};
      const {key}=this;
      if(this.getNiossLoad(key)?.[ne_id]){
        return 'ic-loading rotating main-lilac';
      }else if(this.getNiossResp(key)?.[ne_id]){
        return 'ic-checkmark main-green';
      }else if(this.getNiossError(key)?.[ne_id]){
        return 'ic-warning main-orange';
      }else if(this.getNiossResp(key)){
        return 'ic-clock tone-200 rotating';
      };
      return;
    },
  },
});






















