Vue.component('PingLed',{
  template:`<div class="display-flex align-items-center cursor-pointer" @click.stop="click">
    <span class="ic-20" :class="pingLoading?'ic-loading rotating tone-500':pingResultClass"></span>
  </div>`,
  props:{
    mr_id:{type:[String,Number],required:true,default:0},
    ip:{type:String,required:true,default:''},
    noPingOnCreated:{type:Boolean,default:false},
    disabled:{type:Boolean,default:false},
  },
  created(){
    if(!this.noPingOnCreated){
      this.ping();
    };
  },
  watch:{
    'ip'(){
      if(!this.noPingOnCreated){
        this.ping();
      };
    },
    'pingLoading'(loading){
      this.$emit('loading',loading)
    },
    'pingResult'(result){
      if(this.pingLoading){return};
      if(!result){return};
      this.$emit('on-result',result)
    }
  },
  computed:{
    ...mapGetters({
      getDnmResp:'dnm/getResp',
      getDnmLoad:'dnm/getLoad',
    }),
    pingResult(){return this.getDnmResp('doPing',atok(this.mr_id,this.ip))},
    pingLoading(){return this.getDnmLoad('doPing',atok(this.mr_id,this.ip))||false},
    state(){return this.pingResult?.state},//public
    pingResultClass(){
      switch(this.state){
        case 'error':return 'ic-warning main-orange';
        case 'online':return 'ic-status main-green';
        case 'offline':return 'ic-status main-red';
        default:return 'ic-status tone-500';
      };
    }
  },
  methods:{
    ...mapActions({
      doPing:'dnm/doPing',
    }),
    click(){
      if(this.disabled){return};
      this.ping();
    },
    async ping(){//public
      const {mr_id,ip}=this;
      return await this.doPing({mr_id,ip});
    }
  },
});

//add full location
Vue.component('device-info',{
  template:`<article class="device-info" :class="[addBorder&&'border-gray']" :style="neIsNotInstalled?'background-color:#eeeeee;':''">
    <info-text-sec tn="site-address-and-rack-location" v-if="showLocation" :text="fullNiossLocation" class="padding-left-right-unset margin-bottom-8px"/>
    
    <header class="device-info__header">
      <PingLed tn="ping-led-btn" v-bind="{ip,mr_id:mrId}" ref="PingLed" noPingOnCreated @on-result="response.ping=$event" @loading="loading.ping=$event"/>
      
      <div @click="toNetworkElement" class="title display-flex align-items-center gap-4px">
        <div tn="str-name-short" class="title-ip">{{networkElementPrefix}}</div>
        <div tn="str-ip" class="title-ip">{{networkElement.ip}}</div>
      </div>
      <div v-if="!noMinimap&&neIsETH&&!neIsNotInstalled" class="width-100px margin-left-auto">
        <PortsLineChart :name="networkElement.name" @click="toNetworkElement"/>
      </div>
      <slot name="link">
        <button-sq v-if="showLink" tn="btn-right-link" @click="toNetworkElement" class="margin--10px">
          <span class="ic-24 ic-right-link main-lilac"></span>
        </button-sq>
      </slot>
    </header>
    <div v-if="!hideEntrances" class="device-info__main" @click="toNetworkElement">
      <div class="device-info__entrances">
        <span class="ic-16 ic-entrance"></span>
        <span class="device-info__entrance-dot"> • </span>
        <template v-if="networkElementEntrances.length">
          <div v-for="(entrance, index) of networkElementEntrances" class="device-info__entrance">
            <span :tn="'str-entrance-'+entrance.number">{{entrance.number}}</span>
            <span>{{(index + 1 < networkElementEntrances.length)?',':''}}</span>
          </div>
        </template>
        <div v-else>Нет данных</div>
      </div>
    </div>
    <div tn="str-admin-status" v-if="showNetworkElementAdminStatus" class="ne-admin-status">{{networkElementAdminStatus}}</div>
    
    <footer class="device-info__params" @click="toNetworkElement">
      <div class="display-flex gap-10px align-items-center">
        <div tn="str-name-and-model" class="font--11-600">{{networkElementLabel}}</div>
        <span v-if="isModelToUtil_r54" class="fa fa-trash tone-500 font-size-11px margin-bottom-2px"></span>
      </div>
      <info-subtitle tn="sys-name" v-if="sysName" :text="sysName"/>
      
      <div v-if="sysUpTime" class="width-100-100 display-flex align-items-center justify-content-end gap-4px">
        <div class="font--13-500 tone-500">sysUpTime:</div>
        <div tn="str-sys-uptime" class="font--13-500">{{sysUpTime}}</div>
        <button-sq tn="btn-sys-info" @click.stop="updateDeviceSysInfo" class="width-20px min-width-20px height-20px">
          <span v-if="loadingSystem" class="ic-20 ic-loading rotating main-lilac"></span>
          <span v-else class="ic-20 ic-refresh main-lilac"></span>
        </button-sq>
      </div>
    </footer>
    
    <template v-if="showSessions&&neIsETH&&xRad_region_id">
      <devider-line/>
      
      <title-main text="Активные сессии" :text2="!loading.sessions?sessionsOk:''" text2Class="main-green" :text3="!loading.sessions?sessionsBad:''" text3Class="main-orange" size="medium" @open="open.sessions=!open.sessions" class="padding-left-0" style="margin-top:-10px;" :style="!open.sessions?'margin-bottom:-10px;':''">
        <button-sq :icon="loading.sessions?'loading rotating':'refresh'" type="medium" @click="get_device_session"/>
      </title-main>
      <div v-show="open.sessions">
        <template v-for="(port_session,i) of sessions">
          <devider-line v-if="i"/>
          <port-info :port="port_session"/>
        </template>
      </div>
    </template>
    <slot name="ports">
      <template v-for="(port,key) of ports">
        <devider-line/>
        <port-info-v1 v-bind="{port,key}" class="margin-left--8px width--webkit-fill-available" noSubs/>
      </template>
    </slot>
  </article>`,
  props:{
    networkElement:{type:Object,required:true},
    entrances:{type:Array},
    hideEntrances:{type:Boolean,default:false},//обслуживаемые подъезды
    showSessions:{type:Boolean,default:false},//кнопка сессий xRad
    rack:{type:Object,default:()=>{}},
    disabled:{type:Boolean,default:false},
    ports:{type:Array,default:()=>[]},
    showLocation:{type:Boolean,default:false},//адрес плошадки СЭ
    showLink:{type:Boolean,default:false},//кнопка перехода на карточку СЭ из виджета
    noMinimap:{type:Boolean,default:false},//линия утилизации
    addBorder:{type:Boolean,default:false},//граница вокруг
    showNetworkElementAdminStatus:{type:Boolean,default:false},
    autoSysInfo:{type:Boolean,default:false},
  },
  data:()=>({
    loading:{
      ping:false,
      dscv:false,
      ports_lite:false,
      sessions:false,
      networkElementDeviceInfo:false,
      deviceSysInfo:false,
      networkElement:false,
      niossNe:false,
      niossRack:false,
      niossRackEntrance:false,
    },
    response:{
      ping:null,
      dscv:null,
      ports_lite:null,
      sessions:[],
      networkElementDeviceInfo:null,
      deviceSysInfo:null,
      networkElement:null,
      niossNe:null,
      niossRack:null,
      niossRackEntrance:null,
    },
    open:{
      sessions:false,
    },
  }),
  computed:{
    isModelToUtil_r54(){
      if(this.networkElement.region.id!==54){return};
      const dlink=this.networkElement.vendor=='D-LINK'&&!/DES-3200-(10|18|28|52)$/i.test(this.networkElement.model);
      const huawei=this.networkElement.vendor=='HUAWEI'&&/S2320-28TP/i.test(this.networkElement.model);
      return dlink||huawei
    },
    loadingSystem(){return this.loading.deviceSysInfo||this.loading.networkElementDeviceInfo||this.loading.networkElement},
    sysName(){return this.response.deviceSysInfo?.SysName||this.response.networkElementDeviceInfo?.sys_name||''},
    sysUpTime(){return this.response.deviceSysInfo?.SysUptime||''},
    isOnline(){ 
      if(this.loading.ping){return};
      return this.response.ping?.state=='online';
    },
    neIsETH(){return testByName.neIsETH(this.networkElement.name)},
    neIsNotInstalled(){return testByName.neIsNotInstalled(this.networkElement.ne_status)},
    networkElementPrefix(){return getNetworkElementPrefix(this.networkElement.name)},
    networkElementEntrances(){
      const {networkElement:{name}}=this;
      return (this.entrances||[]).filter(({device_list})=>device_list.includes(name));
    },
    modelText(){
      const {vendor,model,system_object_id}=this.networkElement;
      return getModelText(vendor,model,system_object_id);
    },
    networkElementAdminStatus(){return NIOSS_NE_ADM_STATUS[this.networkElement.ne_status]||''},
    networkElementLabel(){
      const {name}=this.networkElement;
      const model_or_status=this.modelText||this.networkElementAdminStatus||'';
      return name+(model_or_status?' • '+model_or_status:'')
    },
    xRad_region_id(){//TODO переделать ВЕ для фильтра по region_id коммутатора и площадки
      return [
        22,28,29,30,33,34,35,91,93,37,40,41,42,43,23,
        24,46,77,52,53,54,55,56,57,58,59,25,2,3,12,14,
        16,18,61,64,66,67,26,68,69,71,72,73,27,86,89,76
      ].includes(this.networkElement.region.id);
    },
    sessions(){return this.response.sessions.sort((a,b)=>a.number-b.number).filter(p=>p.account)},
    sessionsOk(){return this.sessions.filter(s=>s?.session?.active).length},
    sessionsBad(){return this.sessions.filter(s=>!s?.session?.active).length},
    
    mrId(){return this.response.networkElement?.region?.mr_id||this.networkElement.region.mr_id},
    ip(){return this.response.niossNe?.IPAddressText||this.response.networkElement?.ip||this.networkElement.ip||''},
    snmpCommunity(){return this.response.niossNe?.SNMPCommunity||this.response.networkElement?.snmp?.community||this.networkElement?.snmp?.community},
    snmpVersion(){return this.response.niossNe?.VersionSNMP||this.response.networkElement?.snmp?.version||this.networkElement?.snmp?.version},
    
    isValidIcmpAttrs(){return this.mrId&&this.ip},
    isValidSnmpAttrs(){return this.mrId&&this.ip&&this.snmpCommunity&&this.snmpVersion},
    
    rackId(){return this.response.niossNe?.ShkafPP?.NCObjectKey},
    rackEntranceId(){return this.response.niossRack?.PodezdShkafa?.NCObjectKey},
    fullNiossLocation(){
      const {region:{location}}=this.networkElement;
      const siteAddressShort=truncateSiteAddress(location);
      if(!this.response.niossRack){return siteAddressShort};
      const {VneEtashnoeRazmechenie='',Etazh='',NomerDRS='',RaspologenieShkaf=''}=this.response.niossRack;
      const {NomerPodezda=''}=this.response.niossRackEntrance||{};
      const hMountText=NomerPodezda?`под. ${NomerPodezda}`:'';
      const vMountText={'Чердак':`на чердаке`,'Технический этаж':`на тех.этаже`,'Подвал':`в подвале`}[VneEtashnoeRazmechenie]||`эт. ${Etazh}`;
      const drsText=!NomerDRS?'':NomerDRS.length>3?NomerDRS:`стояк ${NomerDRS}`;
      //const locationFiltered=[`Подъезд ${NomerPodezda}.`,`Этаж ${Etazh}.`,`${VneEtashnoeRazmechenie}.`,hMountText,vMountText,drsText].reduce((str,sample)=>str.replace(sample,''),RaspologenieShkaf).trim().replace(/^\(|\)$/g,'').toLowerCase();
      return [
        siteAddressShort,
        hMountText,
        vMountText,
        drsText,
        //locationFiltered
      ].filter(Boolean).join(', ');
    },
  },
  async mounted() {
    if(this.showLocation){
      this.getNiossNetworkElementAndRack()
    };
    this.getNetworkElementDeviceInfo();
    if(!this.isValidIcmpAttrs){return}
    await this.$refs.PingLed?.ping();
    if(!this.isValidSnmpAttrs){
      await this.getNetworkElement();
    };
    if(this.isOnline&&this.autoSysInfo){
      this.updateDeviceSysInfo();
    }
  },
  methods: {
    async getNiossNetworkElementAndRack(){
      const {nioss_id}=this.networkElement;
      this.loading.niossNe=!0;
      try{
        const response=await httpGet(buildUrl('get_nioss_object',{object_id:nioss_id,object:'device'},'/call/nioss/'));
        if(response?.parent){
          this.response.niossNe=response;
        };
      }catch(error){
        console.warn('get_nioss_object.error',error);
      };
      this.loading.niossNe=!1;
      const {rackId}=this;
      if(!rackId){return};
      this.loading.niossRack=!0;
      try{
        const response=await httpGet(buildUrl('get_nioss_object',{object_id:rackId,object:'rack'},'/call/nioss/'));
        if(response?.parent){
          this.response.niossRack=response;
        };
      }catch(error){
        console.warn('get_nioss_object.error',error);
      };
      this.loading.niossRack=!1;
      const {rackEntranceId}=this;
      this.loading.niossRackEntrance=!0;
      try{
        const response=await httpGet(buildUrl('get_nioss_object',{object_id:rackEntranceId,object:'entrance'},'/call/nioss/'));
        if(response?.parent){
          this.response.niossRackEntrance=response;
        };
      }catch(error){
        console.warn('get_nioss_object.error',error);
      };
      this.loading.niossRackEntrance=!1;
    },
    updateDeviceSysInfo(){
      this.getDeviceSysInfo(true);
    },
    async getNetworkElement(){
      const {name}=this.networkElement;
      this.loading.networkElement=!0;
      const cache=this.$cache.getItem(`device/${name}`);
      if(cache){
        this.response.networkElement=cache;
      }else{
        try{
          const response=await httpGet(buildUrl('search_ma',{pattern:name},'/call/v1/search/'));
          if(response.data){
            this.$cache.setItem(`device/${name}`,response.data);
            this.response.networkElement=response.data;
          };
        }catch(error){
          console.warn('search_ma:device.error',error);
        }
      };
      this.loading.networkElement=!1;
    },
    async getDeviceSysInfo(update=false){
      const {name}=this.response.networkElement||this.networkElement;
      const {mrId,ip,snmpCommunity,snmpVersion}=this;
      if(!mrId||!ip||!snmpVersion||!snmpCommunity){return};

      const cache=this.$cache.getItem(`device_sys_info/${name}`);
      if(cache&&!update){
        this.response.deviceSysInfo=cache;
        return
      };

      this.loading.deviceSysInfo=!0;
      const response=await httpGet(buildUrl('device_sys_info',objectToQuery({
        ip,name,mr_id:mrId,snmp_version:snmpVersion,snmp_community:snmpCommunity,
      }),'/call/hdm/')).catch(console.warn);
      if(Array.isArray(response?.data)){
        this.response.deviceSysInfo=response.data.reduce((data,row)=>{
          const [key,[value]]=Object.entries(row)[0];
          return Object.assign(data,{[key]:value});
        },{});
        this.$cache.setItem(`device_sys_info/${name}`,this.response.deviceSysInfo,5);
      };
      this.loading.deviceSysInfo=!1;
    },
    async getNetworkElementDeviceInfo(update=false){
      const {name}=this.networkElement;
      const cache=this.$cache.getItem(`get_dismantled_devices:installed/${name}`);
      if(cache&&!update){
        this.response.networkElementDeviceInfo=cache;
        return
      };

      this.loading.networkElementDeviceInfo=!0;
      const response=await httpGet(buildUrl('get_dismantled_devices',{device_name:name},'/call/v1/device/')).catch(console.warn);
      if(Array.isArray(response)){
        this.response.networkElementDeviceInfo=response.find(device=>device.status_device=='INSTALLED_DEVICE');
        this.$cache.setItem(`get_dismantled_devices:installed/${name}`,this.response.networkElementDeviceInfo);
        this.$cache.setItem(`get_dismantled_devices/${name}`,response);
      };
      this.loading.networkElementDeviceInfo=!1;
    },
    async updatePing(){//public
      await this.$refs.PingLed?.ping();
      if(this.isOnline){
        this.updateDeviceSysInfo();
      }
    },
    async get_device_session(){//public
      if(!this.neIsETH){return};
      if(!this.showSessions){return};
      if(!this.xRad_region_id){return};
      if(this.loading.sessions){return};
      this.response.sessions=[];
      this.loading.sessions=!0;
      try{
        const response=await httpGet(buildUrl('device_sessions',objectToQuery({
          name:this.networkElement.name,serverid:78,
        }),'/call/v1/device/')).catch(console.warn);
        if(Array.isArray(response)){
          this.response.sessions=response;
        };
      }catch(error){
        console.warn('device_sessions.error',error);
      };
      this.loading.sessions=!1;
    },
    async discovery(){//public
      if(this.neIsNotInstalled){return};//СЭ не введен в эксплуатацию
      const {name,system_object_id,vendor}=this.response.networkElement||this.networkElement;
      const {mrId,ip,snmpCommunity,snmpVersion}=this;
      if(!ip||!snmpVersion||!snmpCommunity){return};
      this.loading.dscv=!0;
      try{
        const response=await httpPost(buildUrl('dev_discovery',objectToQuery({ip,name}),'/call/hdm/'),{
          ip,mrId,
          device:{
            MR_ID:mrId,DEVICE_NAME:name,IP_ADDRESS:ip,
            SYSTEM_OBJECT_ID:system_object_id||'',VENDOR:vendor||'',
            SNMP_VERSION:snmpVersion,SNMP_COMMUNITY:snmpCommunity,
          }
        }).catch(console.warn);
        this.response.dscv=response;
        if(response?.code==200){
          this.$cache.removeItem(`device/${name}`);
          this.$cache.removeItem(`search_ma/${name}`);
        };
      }catch(error){
        console.warn('dev_discovery.error',error);
      };
      this.loading.dscv=!1;
    },
    toNetworkElement(){
      if(this.disabled){return};
      const {networkElement,response,rack}=this;
      const rackName=response.niossRack?.resource_business_name||rack?.name;
      if(rackName){
        this.$router.push({
          name:'network-element-in-rack',
          params:{
            deviceProp:response.networkElement||networkElement,
            rackProp:rack,
            device_id:networkElement.name,
            rack_id:rackName,
          },
        });
      }else{
        const prefix=getNetworkElementPrefix(networkElement.name);
        if(prefix==='CMTS'){//CMTS_16KR_03383_1 site:9135155036813484532
          this.$router.push({
            name: "ds_device",
            params: { name: networkElement.name},
          });
        }else{
          this.$router.push({//direct route for support unmount ETH devices
            name:"network-element",
            params:{
              device_id:networkElement.name,
              deviceProp:networkElement,
            },
          });
        }
      };
    },
  },
});

