Vue.component('task-find-port',{
  template:`<div name="task-find-port">
    <loader-bootstrap v-if="loading" text="загрузка устройств"/>
    <SiteLinkChangeTraps v-bind="{site_id:task.siteid}"/>
    <FindPort v-if="!loading" :devices="networkElementsById" :racks="racksById" :entrances="entrancesById" :selectedEntrance="entrance" :site_id="task.siteid" replaceSwitchOnCheckbox/>
    <TaskExt :site_id="task.siteid"/>
    <CardBlock>
      <free-ports-list :networkElementsNames="networkElementsNames" :networkElementsByName="networkElementsByName" :focused="focused" showAllPorts startOnFocus/>
    </CardBlock>
  </div>`,
  props:{
    task:{type:Object,required:true},
    focused:{type:Boolean,default:false},
  },
  data:()=>({
    resps:{
      networkElements:[],
      entrances:[],
      racks:[],
    },
    loads:{
      networkElements:false,
      entrances:false,
      racks:false,
    },
  }),
  created(){
    this.getAll();
  },
  computed:{
    networkElementsNames(){
      return this.resps.networkElements.map(({name})=>name);
    },
    loading(){
      return Object.values(this.loads).some(l=>l);
    },
    networkElementsByName(){
      return this.resps.networkElements.reduce((networkElements,networkElement)=>({...networkElements,[networkElement.name]:networkElement}),{})
    },
    networkElementsById(){
      return this.resps.networkElements.reduce((networkElements,networkElement)=>({...networkElements,[networkElement.nioss_id]:networkElement}),{})
    },
    entrancesById(){
      return this.resps.entrances.reduce((entrances,entrance)=>({...entrances,[entrance.id]:entrance}),{});
    },
    racksById(){
      return this.resps.racks.reduce((racks,rack)=>({...racks,[rack.id]:rack}),{});
    },
    flat(){
      const flatInAddrIndex=this.task.AddressSiebel.search(/кв\./gi);
      if(flatInAddrIndex==-1){return 0};
      const flat=this.task.AddressSiebel.substring(flatInAddrIndex+4).replace(/\D/g, '');
      return Number(flat);
    },
    entrance(){
      return this.resps.entrances.find(entrance=>this.flat>=entrance.flats.from&&this.flat<=entrance.flats.to);
    },
  },
  watch:{
    focused(isFocused){
      const startLoading=isFocused&&!this.resps.networkElements?.length&&!this.loading;
      if(startLoading){this.getAll()};
    }
  },
  methods: {
    getAll(){
      this.getDevices();
      this.getEntrances();
      this.getRacks();
    },
    async getDevices(){
      const {siteid:site_id=''}=this.task;
      if(!site_id){return};
      this.loads.networkElements=true;
      let response=this.$cache.getItem(`devices/${site_id}`);
      if(response){
        this.resps.networkElements=response;
      }else{
        try{
          response=await httpGet(buildUrl("devices",{site_id},"/call/v1/device/"));
          if(response.type==='error'){throw new Error(response.message)};
          response=response||[];
          this.resps.networkElements=response;
          this.$cache.setItem(`devices/${site_id}`,response);
        }catch(error){
          console.warn('devices.error',error);
        }
      }
      this.loads.networkElements=false;
    },
    async getEntrances(){
      const {siteid:site_id=''}=this.task;
      if(!site_id){return};
      this.loads.entrances=true;
      let response=this.$cache.getItem(`site_entrance_list/${site_id}`);
      if(response){
        this.resps.entrances=response;
      }else{
        try{
          response=await httpGet(buildUrl("site_entrance_list",{site_id},"/call/v1/device/"));
          if(response.type==='error'){throw new Error(response.message)};
          response=response||[];
          this.resps.entrances=response;
          this.$cache.setItem(`site_entrance_list/${site_id}`,response);
        }catch(error){
          console.warn('site_entrance_list.error',error);
        }
      }
      this.loads.entrances=false;
    },
    async getRacks(){
      const {siteid:site_id=''}=this.task;
      if(!site_id){return};
      this.loads.racks=true;
      let response=this.$cache.getItem(`site_rack_list/${site_id}`);
      if(response){
        this.resps.racks=response;
      }else{
        try{
          response=await httpGet(buildUrl("site_rack_list",{site_id},"/call/v1/device/"));
          if(response.type==='error'){throw new Error(response.message)};
          response=response||[];
          this.resps.racks=response;
          this.$cache.setItem(`site_rack_list/${site_id}`,response);
        }catch(error){
          console.warn('site_rack_list.error',error);
        }
      }
      this.loads.racks=false;
    },
  }
});
