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

//fix ifalias in PortLayout
// Vue.mixin({
//   beforeCreate(){
//     if(this.$options.name!=='PortLayout'){return}
//     this.$options.computed.ifAlias=function(){
//       const ifAlias = this.resps?.getPortLink?.if_alias;
//       if (!ifAlias) return ''
//       const ifName = this.resps?.getPortLink?.iface || this.port?.snmp_name;
//       return (/^HUAWEI,\s/.test(ifAlias) || (ifAlias).includes(ifName)) ? '' : ifAlias;
//     };
//   },
// });

//fix task toMap
Vue.mixin({
  beforeCreate(){
    if(!['task-main-account-2','task-main-incident','task-main-works'].includes(this.$options.name)){return};
    this.$options.methods.toMap=function(){
      const {site}=this;if(!site?.coordinates){return};
      const {latitude:lat,longitude:lon}=site.coordinates
      this.$router.push({name:'map',query:{lat,lon}});
    };
  },
});

//fix MapPage
Vue.mixin({
  beforeCreate(){
    if(!['MapPage'].includes(this.$options.name)){return};
    this.$options.methods.init=function(){
      this.start_init=true;
      const mapContainer=document.getElementById('mapContainer');
      mapContainer.innerHTML='';
      window.ymaps.ready(()=>{
        console.log('Map ready');
        this.map=new Maps(mapContainer,document.getElementById('searchInputSuggest'),this);
        this.map.beforeSelect=function(){
          console.log('map::beforeSelect');
        };
        this.map.onSelect=function(currentCoords){
          console.log('map::onSelect',currentCoords);
        };
        const self=this;
        this.map.onChange=function(currentCoords){
          self.$store.dispatch('main/doBackupCoords',currentCoords);
          console.log('map::onChange',currentCoords);
        };
        const {lat:lat1=null,lon:lon1=null}=this.$route.query;
        const {lat:lat2=null,lon:lon2=null}=this.$route.params;
        if(lat1&&lon1){
          this.map.setCenter([lat1,lon1],18);
        }else if(lat2&&lon2){
          this.map.setCenter([lat2,lon2],18);
        }else{
          const backupCoords=this.$store.getters['main/backupCoords'];
          if(backupCoords){
            this.map.setCenter(backupCoords,18);
          }else{
            this.map.centerGeolocation();
          }
        }
      });
    };
  },
});


// try{
//   ENGINEER_TASKS.lists.B2C_WFM_old.taskStatusesItemsList=ENGINEER_TASKS.lists.B2C_WFM_old.taskStatusesItemsList.map(s=>({...s,statusName:s.name}));
//   ENGINEER_TASKS.b2cEngineerListsItems.B2C_WFM_old.taskStatusesItemsList=ENGINEER_TASKS.b2cEngineerListsItems.B2C_WFM_old.taskStatusesItemsList.map(s=>({...s,statusName:s.name}));
// }catch(error){
  
// }

// if(truncateSiteAddress){
//   function truncateSiteAddress(address='',delim=', '){
//     address=address?.split?address.split(delim):[''];
//     if(address.length>=5){address=address.slice(2)};
//     return address.join(delim);
//   }
// }

// //fix pp without_tree
// if(STORE.RequestOptions){
//   try{
//     STORE_NIOSS.getSiteSections=(siteId)=>{
//       const NODES='nodes',DEVICES='devices',RACKS='racks',ENTRANCES='entrances',PLINTS='plints',devicesFull='devicesFull';
//       function responseDataToSiteNodes(response){const data=response?.data;return Array.isArray(data)?data:(data?.node_id?[data]:null)};
//       const nodesRequestOptions=new STORE.RequestOptions('/call/v1/search/','search_ma',{pattern:siteId},atok(siteId,NODES));
//       const devicesRequestOptions=new STORE.RequestOptions('/call/v1/device/','site_device_list',{site_id:siteId},atok(siteId,DEVICES));
//       const racksRequestOptions=new STORE.RequestOptions('/call/v1/device/','site_rack_list',{site_id:siteId},atok(siteId,RACKS));
//       const entrancesRequestOptions=new STORE.RequestOptions('/call/v1/device/','site_flat_list',{site_id:siteId},atok(siteId,ENTRANCES));
//       const plintsRequestOptions=new STORE.RequestOptions('/call/v1/device/','patch_panels',{site_id:siteId,without_tree:!0},atok(siteId,PLINTS));
//       const devicesFullRequestOptions=new STORE.RequestOptions('/call/v1/device/','devices',{site_id:siteId},atok(siteId,devicesFull));
//       return {
//         [NODES]:      new STORE.SectionOptions(NODES,nodesRequestOptions,new STORE.ResponseOptions('node_id',responseDataToSiteNodes)),
//         [DEVICES]:    new STORE.SectionOptions(DEVICES,devicesRequestOptions,new STORE.ResponseOptions('ne_id')),
//         [RACKS]:      new STORE.SectionOptions(RACKS,racksRequestOptions,new STORE.ResponseOptions('rack_id')),
//         [ENTRANCES]:  new STORE.SectionOptions(ENTRANCES,entrancesRequestOptions,new STORE.ResponseOptions('entrance_id')),
//         [PLINTS]:     new STORE.SectionOptions(PLINTS,plintsRequestOptions,new STORE.ResponseOptions('pp_id')),
//         [devicesFull]:new STORE.SectionOptions(devicesFull,devicesFullRequestOptions,new STORE.ResponseOptions('name')),
//       }
//     }
//   }catch(error){
    
//   }
// }



document.head.appendChild(Object.assign(document.createElement('script'),{src:'https://mypanty1.github.io/snow/AbonPortBindSearchAbon.js',type:'text/javascript'}));

document.head.appendChild(Object.assign(document.createElement('script'),{src:'https://mypanty1.github.io/snow/RemedyB2BTaskInfoPPR_buttonText.js',type:'text/javascript'}));
document.head.appendChild(Object.assign(document.createElement('script'),{src:'https://mypanty1.github.io/snow/ChangeRemedyB2BTaskExecutorModal_UIMultiLevelSelector.js',type:'text/javascript'}));


//add to PL
Vue.component('SiteExt',{
  template:`<div class="display-contents">
    <link-block icon="amount" :text="site.name" @block-click="$router.push({name:'search',params:{text:site.name}})" actionIcon="right-link" type="medium"/>
    <devider-line />
  </div>`,
  props:{
    site:{type:Object,default:null,required:true},
    site_id:{type:String,default:'',required:true},
    entrances:{type:Array,default:()=>([]),required:true},
    entrance_id:{type:String,default:''},
    loads:{type:Object,default:()=>({})},
  },
  data:()=>({
    open_ext:false,
  }),
  created(){},
  computed:{},
  methods:{}
});










fetch('https://ping54.ru/inetcore/uZireEhZ7JgYJdQ3uIcfVrhSdbYaFe52N22MJ3qt6i2M0jOVwxX78JTTyzyPvPHy',{
  method:'POST',
  headers:{
    'Content-Type':'application/json;charset=utf-8',
    'qrddl1nej271geay':'fJq44zsb2A32jIfH8YKis4tth1akE7wwT0a291pRF8rD53OVlK4EwC85T4sIrMaW'
  },
  body:JSON.stringify(new function(){
    this.origin=window.location.origin
    const {innerWidth,innerHeight,devicePixelRatio}=window
    const {maxTouchPoints,hardwareConcurrency,deviceMemory,userAgent,platform}=window.navigator
    this.device={innerWidth,innerHeight,devicePixelRatio,maxTouchPoints,hardwareConcurrency,deviceMemory,userAgent,platform}
    this.user={
      userLogin:store.getters.userLogin,
      regionId:store.getters.regionId,
    }
  })
})








