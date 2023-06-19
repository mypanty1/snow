//fix time zone
Vue.component('SessionItem',{
  template:`<section name="SessionItem">
    <title-main v-bind="titleProps" textClass="font--13-500" class="margin-top-bottom--8px"/>
    <loader-bootstrap v-if="loads.get_online_sessions" text="получение сессии абонента"/>
    <loader-bootstrap v-else-if="loads.stop_session_radius" text="сброс сессии абонента"/>
    <div v-else-if="session" class="margin-left-16px margin-right-16px display-flex flex-direction-column gap-4px">
      <message-el v-if="isError" :text="errorText" type="warn" box/>
      <template v-else>
        <message-el :text="!start?'Оффлайн':('Онлайн c '+(startLocal||start))" :type="!start?'warn':'success'" box/>
        <div v-if="sessionid" class="display-flex align-items-center justify-content-center">
          <span class="font-size-12px">{{sessionid}}</span>
        </div>
        
        <div class="display-flex flex-direction-column">
          <info-value v-if="ip" label="IP" :value="ip" withLine class="padding-unset" data-ic-test="session_ip"/>
          <info-value v-if="macIsValid" label="MAC" :value="mac" withLine class="padding-unset" data-ic-test="session_mac"/>
          <info-text-sec v-if="macVendor" :text="macVendor" class="padding-unset text-align-right"/>
          <info-value v-if="service_info" label="Сервис" :value="service_info" withLine class="padding-unset"/>
          <info-value v-if="inner_vlan" label="C-Vlan" :value="inner_vlan" withLine class="padding-unset"/>
          <info-value v-if="outer_vlan" label="S-Vlan" :value="outer_vlan" withLine class="padding-unset"/>
          <info-value v-if="port" label="Opt.82 Порт" :value="agent_circuit_id" withLine class="padding-unset"/>
          <info-value v-if="device" label="Opt.82 Коммутатор" :value="agent_remote_id" withLine class="padding-unset"/>
          <info-text-sec v-if="deviceMacVendor" :text="deviceMacVendor" class="padding-unset text-align-right"/>
          <info-value v-if="nas" label="BRAS" :value="nas" withLine class="padding-unset" data-ic-test="session_nas"/>
        </div>
        <div class="display-flex justify-content-space-between gap-4px margin-bottom-8px">
          <button-main @click="$refs.SessionHistoryModal.open()" button-style="outlined" :disabled="false" icon="history" label="История" loading-text="" size="large" data-ic-test="session_history_btn" />
          <button-main @click="stop_session_radius" button-style="outlined" :disabled="!start" icon="refresh" label="Сброс" loading-text="" size="large" data-ic-test="session_reset_btn" />
          <button-main @click="$refs.SessionLogsModal.open()" button-style="outlined" :disabled="false" icon="log" label="Логи" loading-text="" size="large" data-ic-test="session_logs_btn" />
        </div>
        
        <SessionHistoryModal ref="SessionHistoryModal" :session="session" :params="params"/>
        <SessionLogsModal ref="SessionLogsModal" :session="session" :params="params"/>
      </template>
    </div>
    <div v-else-if="isTooManyInternetServices" class="margin-left-16px margin-right-16px">
      <message-el text="сессия не была запрошена" type="info" box/>
    </div>
  </section>`,
  props:{
    params:{type:Object,required:true},
    isTooManyInternetServices:{type:Boolean,default:false},
  },
  data:()=>({
    resps:{
      get_online_sessions:null,
      stop_session_radius:null
    },
    loads:{
      get_online_sessions:false,
      stop_session_radius:false
    },
    ouis:{},
  }),
  watch:{
    'mac'(mac){
      if(mac&&this.macIsValid){this.getMacVendorLookup(mac)};
    },
    'deviceMac'(deviceMac){
      if(deviceMac){this.getMacVendorLookup(deviceMac)};
    },
  },
  created(){ 
    if(this.isTooManyInternetServices){return };
    this.get_online_sessions() 
  },
  computed:{
    titleProps(){
      const {serverid,agentid,vgid,login,descr}=this.params;
      const service_hash=atok(...[serverid,vgid,agentid].filter(v=>v));
      if(!login){return {text:service_hash}};
      return {text:login,text2:service_hash}
    },
    loading(){return Object.values(this.loads).some(v=>v)},
    session(){return this.resps.get_online_sessions?.data?.[0]||this.resps.get_online_sessions},
    isError(){return this.session?.isError},
    errorText(){return this.session?.message||'Error: unknown'},
    device(){return this.session?.device||''},
    deviceStr(){return `${this.device||''}`},
    deviceMac(){return ((this.deviceStr.match(/^[a-f0-9]{12}$/gi)?.[0]||'').match(/.{4}/gi)||[]).join('.')},
    agent_remote_id(){
      const {deviceStr,deviceMac}=this;
      if(deviceMac){//30150037478 - default format
        return deviceMac;
      };
      const isNotHex=/\W/i.test(deviceStr);
      if(isNotHex){//10702046999 - ascii format
        return deviceStr
      };
      return (deviceStr.match(/.{2}/gi)||[]).map(b=>{
        b=b.padStart(2,0);
        try{//60910533888 - custom format
          return unescape('%'+b);
        }catch(error){
          return b
        };
      }).join('');
    },
    ip(){return this.session?.ip||''},
    mac(){return this.session?.mac||''},
    nas(){return this.session?.nas||''},
    port(){return this.session?.port||''},
    agent_circuit_id(){return `${this.port||''}`},//40206334997
    sessionid(){return this.session?.sessionid||''},
    inner_vlan(){return this.session?.inner_vlan||''},
    outer_vlan(){return this.session?.outer_vlan||''},
    service_info(){return this.session?.service_info||''},
    start(){return this.session?.start||''},
    timeZone(){return this.session?.timeZone||''},
    startLocal(){
      const {start,timeZone}=this;
      if(!start||!timeZone){return};
      const date=new Date(start);
      date.setHours(date.getHours()+(timeZone-3));
      return Date.prototype.toDateTimeString?date.toDateTimeString():date.toLocaleString();
    },
    macIsValid(){return this.mac&&this.mac!=='0000.0000.0000'},
    macVendor(){return this.ouis[this.mac]},
    deviceMacVendor(){return this.ouis[this.deviceMac]},
  },
  methods:{
    async get_online_sessions(){
      if(this.loads.get_online_sessions){return};
      this.resps.get_online_sessions=null;
      this.loads.get_online_sessions=true;
      const {serverid,agentid,vgid,login,descr}=this.params;//descr 2000000721940
      try{
        const response=await httpGet(buildUrl('get_online_sessions',{serverid,agentid,vgid,login,descr:/xrad/i.test(descr)?'xrad':''},'/call/aaa/'))
        this.resps.get_online_sessions=response;
      }catch(error){
        console.warn("get_online_sessions.error",error);
        this.resps.get_online_sessions={data:[{isError:true,message:'Error: unexpected'}]};
      };
      this.loads.get_online_sessions=false;
    },
    async stop_session_radius(){
      if(this.loads.stop_session_radius){return};
      this.resps.stop_session_radius=null;
      this.loads.stop_session_radius=true;
      const {serverid,agentid,vgid,login,descr}=this.params;//descr 2000000721940
      const {sessionid,dbsessid,nas}=this.session;
      try{
        const response=await httpGet(buildUrl('stop_session_radius',{serverid,agentid,vgid,login,descr:/xrad/i.test(descr)?'xrad':'',sessionid,dbsessid,nasip:nas},'/call/aaa/'));
        if(response.message=='OK'){
          this.resps.get_online_sessions=null;
          setTimeout(this.get_online_sessions,10000);
        };
        this.resps.stop_session_radius=response;
      }catch(error){
        console.warn("stop_session_radius.error",error);
      };
      this.loads.stop_session_radius=false;
    },
    async getOnlineSession(){//public
      return await this.get_online_sessions()
    },
    async getMacVendorLookup(mac=''){
      if(!mac){return};
      const ouis=await this.test_getMacVendorLookup([mac]);
      this.ouis={...this.ouis,...ouis};
    },
  }
});
