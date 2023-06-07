//add speed
Vue.component('port-info-v1',{
  template:`<link-block :icon="icon" :text="ifName" :textSub="textSub" textSubClass="font--13-500 tone-500" @click="toPort" actionIcon="right-link" type="medium" class="padding-left-0">
    <button-sq slot="prefix"" @click="getPortStatus">
      <div class="display-flex flex-direction-column align-items-center justify-content-space-between gap-2px">
        <div class="font--10-400 display-flex gap-2px tone-500 min-height-13px">
          <span>{{ifSpeedText}}</span>
        </div>
        <div v-if="loading.port_status||loading_status" class="ic-20 ic-loading rotating"></div>
        <div v-else class="ic-20 border-radius-4px" :class="'ic-'+icon+' '+led"></div>
        <div class="font--10-400 display-flex gap-2px tone-500 min-height-13px">
          <template v-if="errors.value">Err:<span :class="errors.class">{{errors.value}}</span></template>
        </div>
      </div>
    </button-sq>
    <span slot="postfix" class="tone-500 display-flex align-items-center gap-16px">
      <button-sq type="medium" @click="getSfp" icon="-" class="margin-right-4px">
        <div class="ic-20" v-if="loading_sfp||loading.sfp" :class="(loading_sfp||loading.sfp)?'ic-loading rotating':'ic-down'"></div>
        <div v-else-if="!(loading_sfp||loading.sfp)&&sfp&&isValidParams" class="display-flex flex-direction-column align-items-flex-end font--13-500 margin-right-4px">
          <div class="width-60px height-16px line-height-16px display-flex justify-content-space-between tone-500">Tx:<span :class="warns.tx">{{sfp.DdmInfoTxpower}}</span></div>
          <div class="width-60px height-16px line-height-16px display-flex justify-content-space-between tone-500">Rx:<span :class="warns.rx">{{sfp.DdmInfoRxpower}}</span></div>
          <div v-if="!isPon" class="width-60px height-16px line-height-16px display-flex justify-content-space-between tone-500">Lb:<span :class="warns.bias">{{sfp.DdmIndexBias||sfp.DdmInfoIndexBias}}</span></div>
        </div>
      </button-sq>
      <div class="min-width-16px text-align-right" v-if="!noSubs">{{port?.subscriber_list?.length||''}}</div>
    </span>
  </link-block>`,
  props:{
    port:{type:Object,required:true},
    sfp_module:{type:Object,default:null},//из общего запроса
    noInitialGetStatus:{type:Boolean,default:false},//по данным из общего запроса
    noInitialGetSfp:{type:Boolean,default:false},//по данным из общего запроса
    noSubs:{type:Boolean,default:false},//счетчик абонентов на порту
    port_status:{type:Object,default:null},//из общего запроса
    loading_status:{type:Boolean,default:false},//из общего запроса
    loading_sfp:{type:Boolean,default:false},//из общего запроса
    showFlatOnPort:{type:Boolean,default:false},//зквартира вместо ifAlias
  },
  data:()=>({
    loading:{
      port_status:false,
      sfp:false,
      device:false,
    },
    port_status_local:null,//public clear
    sfp_local:null,//public clear
    device:null,
  }),
  created(){
    if(!this.noInitialGetStatus){
      this.getPortStatus();
    };
    if(!this.noInitialGetSfp){
      this.getSfp();
    };
  },
  computed:{
    ifIndex(){return this.port.snmp_number||this.port.if_index||+this.port.port_name?.split('/').reverse()[0]},
    ifName(){return this.port.snmp_name||this.port.if_name},
    ifAlias(){return this.port.snmp_description||this.port.if_alias},
    ifAlias_filtered(){
      if((this.ifAlias||'').includes(this.ifName)){return ''};
      if((this.ifAlias||'').includes('HUAWEI, Quidway Series,')){return ''};
      return this.ifAlias;
    },
    textSub(){return this.showFlatOnPort?this.flatText:this.ifAlias_filtered},
    flatText(){
      let flatText=``;
      const {flat='',subscriber_list=[]}=this.port;
      if(!flat){return flatText};
      flatText=`кв.${flat}`;
      const account=subscriber_list.find(({flat:sub_flat=''})=>sub_flat==flat)?.account;
      if(!account){return flatText};
      return `${flatText} абонент:${account}`;
    },
    name(){return this.port.name||this.port.port_name},
    device_name(){return this.port.device_name||this.port.devicename},
    isPon(){return this.name.startsWith('PORT-OLT')||this.ifName.startsWith('PON')||this.ifName.startsWith('GPON')},
    isOptical(){return this.port.is_sfp_ddm||this.port.is_trunk},
    icon(){return this.isPon?'subordinate':'status'},
    status(){return this.port_status_local||this.port_status},
    errors(){
      let value=parseInt(this.status?.in_error||0);
      if(value<10){
        return {value:0,class:'tone-500'}
      }else if(value>999){
        return {value:'>999',class:'main-orange'}
      }else{
        return {value,class:'tone-500'}
      };
    },
    led(){
      if(!this.status){return 'tone-500'};
      return this.status.admin_state!='up'?'bg-main-red tone-100':this.status.oper_state!='up'?'tone-500 bg-tone-200-bg':'main-green-light bg-main-green'
    },
    ifSpeedText(){return this.status?.oper_state=='up'?{10:"10M",100:"100M",1000:"1G",10000:"10G"}[this.status?.high_speed]||'':''},
    sfp(){return this.sfp_local||this.sfp_module},
    warns(){
      const [warn,norm,grey]=['main-orange','main-green','tone-500'];
      if(!this.sfp){return {rx:grey,tx:grey,bias:grey}};
      const {DdmInfoRxpower,DdmInfoTxpower,DdmIndexBias,DdmInfoIndexBias/*,DdmInfoVoltage,DdmInfoTemperature*/}=this.sfp;
      const DdmBias=DdmIndexBias||DdmInfoIndexBias;//huawei
      if(this.isPon){
        return {
          rx:DdmInfoRxpower==0?grey:DdmInfoRxpower<-27||DdmInfoRxpower>-8?warn:norm,
          tx:DdmInfoTxpower<1||DdmInfoTxpower>8?warn:norm,
          //bias:DdmIndexBias<5||DdmIndexBias>39?warn:'',
          //vcc:DdmInfoVoltage<3.1||DdmInfoVoltage>3.5?warn:'',
          //temp:DdmInfoTemperature>59?warn:''
        };
      }else{
        return {
          rx:DdmInfoRxpower<-14||DdmInfoRxpower>-1?warn:norm,
          tx:DdmInfoTxpower<-2||DdmInfoTxpower>3?warn:norm,
          bias:DdmBias<5||DdmBias>39?warn:norm,
          //vcc:DdmInfoVoltage<3.1||DdmInfoVoltage>3.5?warn:'',
          //temp:DdmInfoTemperature>59?warn:''
        };
      }
      
    },
    isValidParams(){//need enable perf mibs on olt
      return this.sfp?.DdmInfoVoltage!=0;
    },
  },
  methods:{
    getPortStatusAndSfp(){
      this.getPortStatus();
      this.getSfp();
    },
    async getPortStatus(){
      this.loading.port_status=true;
      this.port_status_local=null;
      try{
        const response=await httpGet(buildUrl('port_status_by_ifindex',{
          device:this.device_name,
          port_ifindex:this.ifIndex,
          component:'port-info-v1'
        },"/call/hdm/"));
        if(!response.code){
          this.port_status_local=response;
        };
      }catch(error){
        console.warn('port_status.error', error);
      };
      this.loading.port_status=false;
    },
    async getSfp(){
      if(this.isPon){
        await this.getDevice();
        this.getPonSfp();
      }else if(this.isOptical){
        await this.getDevice();
        this.getPortSfp();
      }
    },
    async getPonSfp(){
      if(!this.device){return};
      const {device_name}=this;
      this.loading.sfp=true;
      this.sfp_local=null;
      try{
        const response=await httpGet(buildUrl('sfp_iface',{
          device_name,
          port:this.ifName,
          component:'port-info-v1'
        },"/call/hdm/"));
        if(!response.code&&response.length){
          if(!['unknown','invalid','absent'].includes(response[0].DdmInfoType)){
            this.sfp_local=response[0];
          };
        };
      }catch(error){
        console.warn('sfp_iface.error', error);
      };
      this.loading.sfp=false;
    },
    async getPortSfp(){
      if(!this.device){return};
      const {region:{mr_id:MR_ID},name:DEVICE_NAME,ip:IP_ADDRESS,system_object_id:SYSTEM_OBJECT_ID,vendor:VENDOR,snmp:{version:SNMP_VERSION,community:SNMP_COMMUNITY}}=this.device;
      this.loading.sfp=true;
      this.sfp_local=null;
      try{
        const response=await httpGet(buildUrl('sfp_detail',{
          MR_ID,
          IP_ADDRESS,
          SYSTEM_OBJECT_ID,
          SNMP_COMMUNITY,
          SNMP_VERSION,
          VENDOR,
          ACT:'sfp_iface',
          PORT:this.ifName,
          component:'port-info-v1'
        },'/call/hdm/'));
        if(response.type==='error'){
          throw new Error(response.text);
        };
        if(typeof response==="object"){
          const sfp=Object.values(response)[0];
          if(sfp){
            //приводим к формату как у sfp_iface
            this.sfp_local=Object.keys(sfp).reduce((params,key)=>{
              return Object.assign(params,{[key]:Object.keys(sfp[key])[0]||''});
            },{});
          };
        };
      }catch(error){
        console.warn('sfp_detail.error',error);
      };
      this.loading.sfp=false;
    },
    async getDevice(){
      if(this.device){return};
      this.loading.device=true;
      this.device=null;
      const {device_name}=this;
      const cache=this.$cache.getItem(`device/${device_name}`);
      if(cache){
        this.device=cache;
      }else{
        try{
          let response=await httpGet(buildUrl('search_ma',{pattern:device_name,component:'port-info-v1'},'/call/v1/search/'));
          if(response.data){
            this.$cache.setItem(`device/${device_name}`,response.data);
            this.device=response.data;
          };
        }catch(error){
          console.warn('search_ma:device.error',error);
        };
      };
      this.loading.device=false;
    },
    toPort(){
      this.$router.push({
        name:this.isPon?'olt-port':'eth-port',
        params:{id:this.name},
      });
    },
  },
});
