Vue.component('SiteExt',{
  template:`<div class="display-contents">
    <FixIptvIcon v-bind="$props"/>
  </div>`,
  props:{
    site:{type:Object,default:null,required:true},
    site_id:{type:String,default:'',required:true},
    entrances:{type:Array,default:()=>([]),required:true},
    entrance_id:{type:String,default:''},
    loads:{type:Object,default:()=>({})},
  },
  data:()=>({}),
  created(){},
  computed:{},
  methods:{}
});
Vue.component('FixIptvIcon',{
  template:`<div name="FixIptvIcon" v-if="!loadingSome" class="position-relative">
    <div class="position-absolute" style="top:-32px;right:10px;">
      <flat-service-icon v-if="isIptvTech" status="green">
        <icon-youtube-tv20 class="main-lilac size-24px"/>
      </flat-service-icon>
    </div>
  </div>`,
  props:{
    site:{type:Object,default:null,required:true},
    site_id:{type:String,default:'',required:true},
    entrances:{type:Array,default:()=>([]),required:true},
    entrance_id:{type:String,default:''},
    loads:{type:Object,default:()=>({})},
  },
  data:()=>({
    buildingInfo:null,
  }),
  created(){
    this.getBuildingInfo();
  },
  computed:{
    loadingSome(){return Object.values(this.loads).some(Boolean)},
    tvType(){return this.buildingInfo?.tvType||''},
    isIptvTech(){return /iptv/i.test(this.tvType)},
  },
  methods:{
    async getBuildingInfo(){
      const {site:siteNode}=this;
      if(!siteNode){return};
      const {node:nodeName,coordinates:{latitude,longitude}={}}=siteNode;
      
      const buildingInfo=this.$cache.getItem(atok('buildingInfo',nodeName));
      if(buildingInfo){
        this.buildingInfo=buildingInfo
        return
      };
      if(!latitude||!longitude){return};
      
      try{
        let response=await httpGet(buildUrl("buildings",{zoom:17,coords:[latitude,longitude].join(','),format:'info'}, "/call/v1/device/"));
        if(!response.length){response=[]};
        for(const buildingInfo of response){
          if(buildingInfo.nodeName===nodeName){
            this.buildingInfo=buildingInfo;
          };
          this.$cache.setItem(atok('buildingInfo',buildingInfo.nodeName),buildingInfo);
        };
      }catch(error){
        console.warn('buildings.error',error)
      };
    },
  }
});

