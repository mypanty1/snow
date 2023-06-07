//disable initial
Vue.component('free-ports-list',{
  template:`<div>
    <link-block icon="cable-test" text="Свободные линии" :actionIcon="!startOnFocus?'play':'-'" type="large" :loading="loads.ports" @block-click="getFreeLines"/>
    <message-el v-if="resps.ports&&!loads.ports" v-bind="message" class="padding-left-right-16px"/>
    <div v-if="showAllPorts" class="margin-left-right-16px display-flex flex-direction-column gap-8px">
      <device-info v-for="(networkElement,name) in networkElementsWithFreePorts" :key="name" :networkElement="networkElement" hideEntrances addBorder>
        <template slot="ports">
          <template v-for="(port,name) in portsByNetworkElementNames[networkElement.name]">
            <devider-line/>
            <port-info-v1 :port="port" :key="name" noSubs showFlatOnPort noInitialGetStatus noInitialGetSfp/>
          </template>
        </template>
      </device-info>
    </div>
    <template v-else>
      <template v-if="freeLines.noFlat?.length"> 
        <title-main text="Линии без квартиры" :text2="freeLines.noFlat.length" @open="showPortsWithoutFlat=!showPortsWithoutFlat"/>
        <collapse-slide :opened="showPortsWithoutFlat">
          <div class="margin-left-right-16px display-flex flex-direction-column gap-8px">
            <device-info v-for="(networkElement,name) in networkElementsWithFreePortsWithoutFlat" :key="name" :networkElement="networkElement" hideEntrances addBorder>
              <template slot="ports">
                <template v-for="(port,name) in portsWithoutFlatByNetworkElementNames[networkElement.name]">
                  <devider-line/>
                  <port-info-v1 :port="port" :key="name" noSubs noInitialGetStatus noInitialGetSfp/>
                </template>
              </template>
            </device-info>
          </div>
        </collapse-slide>
      </template>
    </template>
  </div>`,
  props:{
    flats:{type:Object,default:()=>({})},
    networkElementsNames:{type:Array,required:true,validator:(arr)=>arr.every(name=>typeof name==='string')},
    networkElementsByName:{type:Object,default:()=>({})},
    focused:{type:Boolean,default:false},
    showAllPorts:{type:Boolean,default:false},
    startOnFocus:{type:Boolean,default:false},
  },
  data:()=>({
    resps:{
      ports:null
    },
    loads:{
      ports:false
    },
    freeLines:{
      inFlat:[],
      noFlat:[]
    },
    message:{type:'',text:''},
    showPortsWithoutFlat:false,
  }),
  created(){
    if(!this.startOnFocus){
      this.getFreeLines();
    };
  },
  watch:{
    'focused'(focused){
      if(this.startOnFocus&&focused&&!this.loads.ports){
        this.getFreeLines()
      };
    },
    'resps.ports'(ports){
      this.parsePorts();
    },
  },
  computed:{
    cacheKey(){return `${[...new Set(this.networkElementsNames.join('-').split(/-|_/g))].join('-')}`},
    portsForThisEntranceFlats(){return this.freeLines.inFlat.filter(flat=>flat.flat>=this.flats.from&&flat.flat<=this.flats.to)},
    portsByNetworkElementNames(){
      return (this.resps.ports||[]).reduce((portsByNetworkElementNames,port)=>{
        const {device_name:networkElementName,name}=port;
        if(!portsByNetworkElementNames[networkElementName]){portsByNetworkElementNames[networkElementName]={}};
        portsByNetworkElementNames[networkElementName][name]=port;
        return portsByNetworkElementNames
      },{});
    },
    networkElementsWithFreePorts(){
      return Object.keys(this.portsByNetworkElementNames).reduce((networkElementsWithFreePorts,name)=>{
        const networkElement=this.networkElementsByName[name];
        if(networkElement){networkElementsWithFreePorts[name]=networkElement};
        return networkElementsWithFreePorts
      },{});
    },
    portsWithoutFlatByNetworkElementNames(){
      return (this.freeLines.noFlat||[]).reduce((portsWithoutFlatByNetworkElementNames,port)=>{
        const {device_name:networkElementName,name}=port;
        if(!portsWithoutFlatByNetworkElementNames[networkElementName]){portsWithoutFlatByNetworkElementNames[networkElementName]={}};
        portsWithoutFlatByNetworkElementNames[networkElementName][name]=port;
        return portsWithoutFlatByNetworkElementNames
      },{});
    },
    networkElementsWithFreePortsWithoutFlat(){
      return Object.keys(this.portsWithoutFlatByNetworkElementNames).reduce((networkElementsWithFreePortsWithoutFlat,name)=>{
        const networkElement=this.networkElementsByName[name];
        if(networkElement){networkElementsWithFreePortsWithoutFlat[name]=networkElement};
        return networkElementsWithFreePortsWithoutFlat
      },{});
    },
  },
  methods:{
    async getFreeLines(){
      const {networkElementsNames:devices}=this;
      if(!devices?.length){return};
      this.loads.ports=true;
      this.resps.ports=null;
      const cache=this.$cache.getItem(`free_lines/${this.cacheKey}`);
      if(cache){
        this.resps.ports=cache;
      }else{
        try{
          const response=await httpGet(buildUrl('free_lines',objectToQuery({devices})));
          if(response.type==='error'){throw new Error(response.message)};
          this.resps.ports=response;
          this.$cache.setItem(`free_lines/${this.cacheKey}`,response);
        }catch(error){
          console.warn('free_lines.error',error);
        };
      };
      this.loads.ports=false;
    },
    parsePorts(){
      const ports_count=this.resps.ports?.length;
      if(!ports_count){
        this.message={type:'info',text:'Нет информации по линиям'};
        return;
      };
      this.freeLines.inFlat=this.resps.ports.filter(({flat=''})=>flat);
      this.freeLines.noFlat=this.resps.ports.filter(({flat=''})=>!flat);
      this.$emit('update:free-lines',this.freeLines.inFlat);
      const count=this.freeLines.noFlat.length+(this.portsForThisEntranceFlats.length||this.freeLines.inFlat.length);
      const free=plural(['свободная','свободные','свободных'],count);
      const line=plural(['линия','линии','линий'],count);
      this.message={type:'success',text:`Найдено ${count} условно ${free} ${line}`};
    },
  },
});
