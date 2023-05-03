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

//params.descr 2000000721940
Vue.component('sessions', {
  template:`<CardBlock name="sessions" class="padding-bottom-8px bg-white">
    <title-main text="Сессия">
      <button-sq icon="refresh" @click="refreshSessions"/>
    </title-main>
    <SessionHelpModal ref="SessionHelpModal"/>
    <div class="display-flex flex-direction-column">
      <template v-for="(params,index) of servicesParams">
        <devider-line v-if="index"/>
        <SessionItem :params="params" ref="SessionItem" :key="params.vgid"/>
      </template> 
    </div>
  </CardBlock>`,
  props: {
    lbsvServices: { type: Array, default: () => [] },
    forisInternetServices: { type: Array, default: () => [] },
    forisAccount: { type: Object, default: () => ({}) },
    billingType: {
      type: String, 
      default: 'lbsv', // lbsv foris
      validator: (val) => ['lbsv', 'foris'].includes(val)
    }
  },
  computed: {
    servicesParams() {
      const paramsFn = {
        'lbsv': this.getLbsvParams,
        'foris': this.getForisParams
      }
      return paramsFn[this.billingType]
    },
    getLbsvParams() {
      if(this.billingType != 'lbsv') return []
      //if(this.lbsvServices.length>2){return []}
      return this.lbsvServices
        .filter(service => service.isSession && service.status != 10)
        .map(service => ({
          login: service.login,
          serverid: service.serverid,
          vgid: service.vgid,
          agentid: service.agentid,
          descr: service.descr,
        }))
    },
    getForisParams() {
      if(this.billingType != 'foris') return []
      return this.forisInternetServices
        .filter(service => service.login && service.login.login)
        .map(service => ({
          login: service.login.login,
          serverid: this.forisAccount.serverid,
          vgid: service.msisdn,
          descr: 'xrad'
        }))
    }
  },
  methods: {
    sessionHelp() { 
      this.$refs.SessionHelpModal.open() 
    },
    async refreshSessions() {
      if (!this.$refs.SessionItem) return;
      for(let component of this.$refs.SessionItem){
        component.getOnlineSession();
        await new Promise(r=>setTimeout(r,2222))
      }
      //this.$refs.sessions.forEach(component => component.getOnlineSession() )
    },
  }
});
Vue.component('SessionItem',{
  template:`<section name="SessionItem">
    <title-main v-bind="titleProps" textClass="font--13-500" class="margin-top-bottom--8px"/>
    <loader-bootstrap v-if="loads.get_online_sessions" text="получение сессии абонента"/>
    <loader-bootstrap v-else-if="loads.stop_session_radius" text="сброс сессии абонента"/>
    <div v-else-if="session" class="margin-left-16px margin-right-16px display-flex flex-direction-column gap-4px">
      <message-el v-if="isError" text="Error" type="warn" box/>
      <template v-else>
        <message-el :text="!start?'Оффлайн':('Онлайн c '+(startLocal||start))" :type="!start?'warn':'success'" box/>
        <div v-if="sessionid" class="display-flex align-items-center justify-content-center">
          <span class="font-size-12px">{{sessionid}}</span>
        </div>
        
        <div class="display-flex flex-direction-column">
          <info-value v-if="ip" label="IP" :value="ip" withLine class="padding-unset" data-ic-test="session_ip"/>
          <info-value v-if="macIsValid" label="MAC" :value="mac" withLine class="padding-unset" data-ic-test="session_mac"/>
          <info-text-sec v-if="macVendor" :text="macVendor" class="padding-unset text-align-right"/>
          <info-value v-if="port" label="Порт" :value="agent_circuit_id" withLine class="padding-unset"/>
          <info-value v-if="device" label="Коммутатор" :value="agent_remote_id" withLine class="padding-unset"/>
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
  </section>`,
  props:{
    params:{type:Object,required:true},
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
    start(){return this.session?.start||''},
    startLocal(){return this.start;return (!this.start||!Date.prototype.toDateTimeString)?'':new Date(Date.parse(`${this.start} GMT+0300`)).toDateTimeString()},
    macIsValid(){return this.mac&&this.mac!=='0000.0000.0000'},
    macVendor(){return this.ouis[this.mac]},
    deviceMacVendor(){return this.ouis[this.deviceMac]},
  },
  methods:{
    async get_online_sessions(){
      this.resps.get_online_sessions=null;
      this.loads.get_online_sessions=true;
      const {serverid,agentid,vgid,login,descr}=this.params;
      try{
        const response=await httpGet(buildUrl('get_online_sessions',{serverid,agentid,vgid,login,descr:/xrad/i.test(descr)?'xrad':''},'/call/aaa/'))
        this.resps.get_online_sessions=response;
      }catch(error){
        console.warn("get_online_sessions.error",error);
        this.resps.get_online_sessions={data:[{isError:true}]};
      };
      this.loads.get_online_sessions=false;
    },
    async stop_session_radius(){
      this.resps.stop_session_radius=null;
      this.loads.stop_session_radius=true;
      const {serverid,agentid,vgid,login,descr}=this.params;
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
    getOnlineSession(){//public
      this.get_online_sessions()
    },
    async getMacVendorLookup(mac=''){
      if(!mac){return};
      const ouis=await this.test_getMacVendorLookup([mac]);
      this.ouis={...this.ouis,...ouis};
    },
  }
});

//подсветка выбора
Vue.component('FindPort',{
  template:`<CardBlock name="FindPort" class="find-port">
    <title-main :text="titleText" @open="show=!show">
      <button-sq icon="mark-circle" type="large" @click="help.show=!help.show"/>
    </title-main>
    <info-text-icon v-if="help.show" icon="info" :text="help.text"/>
    <template v-if="show">
      <message-el v-if="noEth" text="Нет коммутаторов" type="warn" class="padding-left-right-16px margin-bottom-8px" box/>
      <template v-else>
        <title-main icon="server" text="Коммутаторы" :text2="titleText2" :text2Class="titleText2Class" @open="showSelect=!showSelect" :opened="showSelect" class="margin-top--16px">
          <button-sq icon="factors" @click="showSelect=!showSelect"/>
        </title-main>
        <div v-if="showSelect" class="margin-left-right-16px">

          <title-main text="Выбор по модели" :text2="filterByVendor_countChecked" text2Class="tone-500" @open="showFilterByModel=!showFilterByModel" class="margin-top-bottom--8px padding-left-unset"/>
          <template v-if="showFilterByModel">
            <checkbox-el v-for="(filter,vendor) in filterByVendor" :key="vendor" :label="filter.label" v-model="filter.state" :class="{'width-100-100 bg-main-lilac-light border-radius-4px':filter.state}"/>
          </template>

          <title-main v-if="isFiltrableByEntrance" text="Выбор по подъезду ШДУ" :text2="filterByEntrance_countChecked" text2Class="tone-500" @open="showFilterByEntrance=!showFilterByEntrance" class="margin-top-bottom--8px padding-left-unset"/>
          <template v-if="showFilterByEntrance">
            <checkbox-el v-for="(filter,entrance) in filterByEntrance" :key="'entrance_'+entrance" :label="filter.label" v-model="filter.state" :class="{'width-100-100 bg-main-lilac-light border-radius-4px':filter.state}"/>
          </template>

          <title-main v-if="isFiltrableByFloor" text="Выбор по этажу ШДУ" :text2="filterByFloor_countChecked" text2Class="tone-500" @open="showFilterByFloor=!showFilterByFloor" class="margin-top-bottom--8px padding-left-unset"/>
          <template v-if="showFilterByFloor">
            <checkbox-el v-for="(filter,floor) in filterByFloor" :key="'floor_'+floor" :label="filter.label" v-model="filter.state" :class="{'width-100-100 bg-main-lilac-light border-radius-4px':filter.state}"/>
          </template>

          <title-main v-if="isFiltrableByEntrances" text="Выбор по ГГО коммутатора" :text2="filterByEntrances_countChecked" text2Class="tone-500" @open="showFilterByEntrances=!showFilterByEntrances" class="margin-top-bottom--8px padding-left-unset"/>
          <template v-if="showFilterByEntrances">
            <checkbox-el v-for="(filter,entrance) in filterByEntrances" :key="'ggo_entrance_'+entrance" :label="filter.label" v-model="filter.state" :class="{'width-100-100 bg-main-lilac-light border-radius-4px':filter.state}"/>
          </template>

          <title-main text="Выбор по IP" :text2="ethSelect_countChecked" text2Class="tone-500" @open="showFilterByIp=!showFilterByIp" class="margin-top-bottom--8px padding-left-unset"/>
          <template v-if="showFilterByIp">
            <checkbox-el v-for="device of ethDevices" :key="device.name" :label="device.ip" :label2="device.model" :disabled="ethSelect[device.ip].filtered" v-model="ethSelect[device.ip].selected" @change="setSelect(device.ip)" reverse>
              <div slot="label" class="display-inline-flex gap-2px justify-content-space-between width-100-100" :class="{'tone-500 text-decoration-line-through':ethSelect[device.ip].filtered}">
                <span>{{device.ip}}</span>
                <span>{{device.model}}</span>
              </div>
            </checkbox-el>
          </template>

          <div class="width-100-100 display-inline-flex justify-content-space-between" hidden>
            <span class="font--15-500">Не выбрать все</span>
            <checkbox-el v-if="replaceSwitchOnCheckbox" v-model="selectAll"/>
            <switch-el v-else v-model="selectAll" @change-test="toggleSelectAll"/>
            <span class="font--15-500">Выбрать все</span>
          </div>
          <devider-line/>
        </div>
        
        <div class="width-100-100 display-inline-flex justify-content-space-between align-items-center padding-left-right-16px">
          <span class="font--15-500">C кабель-тестом</span>
          <checkbox-el v-if="replaceSwitchOnCheckbox" v-model="saveData.cableTest" :disabled="!selectedCount"/>
          <switch-el v-else v-model="saveData.cableTest" :disabled="!selectedCount"/>
        </div>

        <div class="width-100-100 display-inline-flex justify-content-center padding-left-right-16px" v-if="selectedCount!==totalCount">
          <info-text-sec :text="selectedTest"/>
        </div>

        <div class="margin-left-right-16px margin-top-8px">
          <button-main @click="getPortStatuses('save')" label="Сохранить состояние портов" :loading="loading.save" :disabled="!selectedCount" :buttonStyle="saveStatus.style" size="full"/>
          <collapse-slide :opened="!!saveTime&&!!selectedCount">
            <message-el :text="savedText" :type="saveData.savedCount?'success':'warn'" box class="margin-top-8px"/>
          </collapse-slide>
        </div>
        
        <div class="margin-left-right-16px margin-top-8px">
          <div v-if="allPortsCount" class="width-100-100 display-inline-flex justify-content-space-between align-items-center" @click="showAll=!showAll">
            <span class="font--15-500">{{'Показать все порты '+(allPortsCount?('('+allPortsCount+')'):'')}}</span>
            <checkbox-el v-if="replaceSwitchOnCheckbox" v-model="showAll" :disabled="!ports.savedPorts"/>
            <switch-el v-else v-model="showAll" :disabled="!ports.savedPorts"/>
          </div>
        </div>
        
        <template v-if="showAll">
          <devider-line/>
          <title-main icon="view-module" text="Все порты" :text2="saveTime?('кэш: '+saveTime):''" text2Class="tone-500"/>
          <template v-for="(device,i) of allPorts">
            <devider-line v-if="i" class="margin-left-right-16px"/>
            <title-main icon="router" :text="device.ip||device.name" :text2="device.ports.length?(device.ports.length+' портов'):''" text2Class="tone-500" @open="showDevicePorts[device.name]=!showDevicePorts[device.name]" class="margin-top-bottom--8px">
              <button-sq icon="refresh" type="large" @click="update_port_status('find_port_all_',device.name)"/>
            </title-main>
            <FindPortItem v-if="showDevicePorts[device.name]" v-for="port of device.ports" :key="port.key" :changedPort="port" :ref="'find_port_all_'+device.name"/>
          </template>
        </template>
       
        <div class="margin-left-right-16px margin-top-8px">
          <button-main @click="getPortStatuses('compare')" label="Сравнить состояние портов" size="full" :loading="loading.compare" :disabled="!selectedCount||compareStatus.disabled||!saveData.savedCount" :buttonStyle="compareStatus.style"/>
          <collapse-slide :opened="!!ports.comparedPorts&&!!selectedCount">
            <message-el :text="comparedText" type="success" box class="margin-top-8px"/>
          </collapse-slide>
        </div>
        <!--9135155036913492310-->
        <message-el v-for="device in ports.savedPorts||{}" :key="device.name+':'+device.ip" v-if="device.message" :text="device.name+':'+device.ip" :subText="device.message" type="warn" box class="margin-left-right-16px margin-top-bottom-4px"/>
        
        <template v-if="!showAll&&ports.changedPorts&&ports.changedPorts.length">
          <devider-line/>
          <title-main icon="search" text="Найденные порты" :text2="saveTime?('кэш: '+saveTime):''" text2Class="tone-500">
            <button-sq icon="refresh" type="large" @click="update_port_status('find_port_changed_')"/>
          </title-main>
          <template v-for="(device,ip,i) in changedPortsByDevices">
            <devider-line v-if="i" class="margin-left-right-16px"/>
            <title-main icon="router" :text="device.ip||device.name" :text2="device.ports.length?(device.ports.length+' портов'):''" text2Class="tone-500" @open="showDevicePortsChanged[device.name]=!showDevicePortsChanged[device.name]" class="margin-top-bottom--8px">
              <button-sq icon="refresh" type="large" @click="update_port_status('find_port_changed_',device.name)"/>
            </title-main>
            <FindPortItem v-if="showDevicePortsChanged[device.name]" v-for="port of device.ports" :key="port.key" :changedPort="port" :ref="'find_port_changed_'+device.name"/>
          </template>
        </template>
      </template>
    </template>
  </CardBlock>`,
  props:{
    devices:{type:Object,default:()=>({})},
    racks:{type:Object,default:()=>({})},
    entrances:{type:Object,default:()=>({})},
    replaceSwitchOnCheckbox:{type:Boolean,default:false},
    selectedEntrance:{type:Object},
    site_id:{type:String,default:'[site_id]'},
  },
  data:()=>({
    loading:{
      save:false,
      compare:false
    },
    show:true,
    help:{
      text:`Можно сохранить состояние всех портов и после сравнить их состояние. Состояние изменяется при пропадании либо появлении линка на порту. Можно расширить сравнение кабель-тестом, будет отслеживаться замыкание/размыкание пар и расхождение в длинне более 3м. Некторые модели коммутаторов прозводят кабель-тест дольше обычного на пару минут, для быстрого поиска рекомендуется искать изменение по линку на порту. 
      С помощью фильтра, для ускорения поиска, можно сузить список коммутаторов для опроса. Можно выбрать по месту устновки ШДУ, по ГГО коммутатора, а также по IP и по производителю.`,
      show:false,
    },
    ports:{
      savedPorts:null,
      comparedPorts:null,
      changedPorts:null,
    },
    portsInfo:{},
    saveData:{
      time:null,
      cableTest:false,
      savedCount:0,
      changedCount:0
    },
    showSelect:false,//свернуть селектор и фильтр
    showFilterByModel:true,
    showFilterByEntrance:true,
    showFilterByFloor:true,
    showFilterByEntrances:true,
    showFilterByIp:true,
    ethSelect:{},//селектор устройств для опроса
    filterByVendor:{},//по вендору
    filterByEntrance:{},//по шкафу
    filterByFloor:{},//по шкафу
    filterByEntrances:{},//по ГГО
    selectAll:true,
    showAll:false,
    showDevicePorts:{},//список устройств для просмотра портов
    showDevicePortsChanged:{},//список устройств для просмотра портов
  }),
  created() {
    this.loadCache();
  },
  watch:{
    'selectAll'(selectAll){
      this.toggleSelectAll();
    }
  },
  computed: {
    isFiltrableByEntrance(){return !!Object.keys(this.filterByEntrance).length},
    isFiltrableByFloor(){return !!Object.keys(this.filterByFloor).length},
    isFiltrableByEntrances(){return !!Object.keys(this.filterByEntrances).length},
    filteredAndSelectedEthDevices(){
      let selected=Object.keys(this.ethSelect).filter(ip=>this.ethSelect[ip].selected).map(ip=>this.ethDevices.find(device=>device.ip===ip)).filter(d=>d);
      let filtered=[...selected];
      
      const vendors=Object.keys(this.filterByVendor).reduce((variants,key)=>{
        if(this.filterByVendor[key]?.state){variants.push(key)}
        return variants
      },[]);
      if(vendors.length){
        filtered=filtered.filter(device=>vendors.includes(device?.vendor));
      };
      
      const entrances=Object.keys(this.filterByEntrance).reduce((variants,key)=>{
        if(this.filterByEntrance[key]?.state){variants.push(key)}
        return variants
      },[]);
      if(entrances.length){
        filtered=filtered.filter(device=>entrances.includes(device?.filter?.entrance_number));
      };
      
      const floors=Object.keys(this.filterByFloor).reduce((variants,key)=>{
        if(this.filterByFloor[key]?.state){variants.push(key)}
        return variants
      },[]);
      if(floors.length){
        filtered=filtered.filter(device=>floors.includes(device?.filter?.floor_name));
      };
      
      const ggo=Object.keys(this.filterByEntrances).reduce((variants,key)=>{
        if(this.filterByEntrances[key]?.state){variants.push(key)}
        return variants
      },[]);
      if(ggo.length){
        filtered=filtered.filter(device=>(device?.filter?.entrances||[]).find(entrance=>ggo.includes((entrance.number/*+'_'+entrance.range*/))));
      };
      
      selected.map(device=>{
        this.$set(this.ethSelect,device.ip,{//серим фильтрацию в селекторе
          ...this.ethSelect[device.ip],
          filtered:!filtered.find(fd=>fd.ip===device.ip)
        });
      });
      return filtered;
    },
    ethSelect_countChecked(){return Object.values(this.ethSelect).filter(filter=>!filter.filtered&&filter.selected).length},
    filterByVendor_countChecked(){return Object.values(this.filterByVendor).filter(filter=>filter.state).length},
    filterByEntrance_countChecked(){return Object.values(this.filterByEntrance).filter(filter=>filter.state).length},
    filterByFloor_countChecked(){return Object.values(this.filterByFloor).filter(filter=>filter.state).length},
    filterByEntrances_countChecked(){return Object.values(this.filterByEntrances).filter(filter=>filter.state).length},
    saveStatus() {
      return {
        style: this.ports.savedPorts ? 'outlined' : 'contained',
        loading: this.loading.save,
        time: this.saveData.time,
      };
    },
    saveTime(){
      const {time}=this.saveData;
      if(!time){return ''};
      return time;//время до секунд, для быстрых сохранений
    },
    compareStatus() {
      return {
        style: 'contained',
        loading: this.loading.compare,
        disabled: !this.ports.savedPorts,
      };
    },
    ethDevices(){//only descovered ETH and adm state = T or C
      return Object.values(this.devices).filter(device=>/eth/i.test(device.name)&&device.system_object_id&&!device.ne_status&&device.ip).reduce((devices,device,i,_devices)=>{
        //add filter keys to device.filter
        const entrances=Object.values(this.entrances).filter(entrance=>entrance.device_id_list.includes(device.nioss_id)).reduce((entrances,entrance)=>{
          if(entrances.find(e=>e.id===entrance.id)){return entrances};
          const {id=0,number=0,flats={}}=entrance;
          const {from=0,to=0,range='',count=0}=flats;
          return [...entrances,{id,number,from,to,range,count}];
        },[]);

        const rack=Object.values(this.racks).find(rack=>rack.ne_in_rack.includes(device.name));
        const {entrance={},floor=null,off_floor=null}=rack||{};
        const {number:entrance_number=null}=entrance;
        const floor_name=off_floor||floor;

        return [...devices,{...device,filter:{entrances,entrance_number,floor_name}}]
      },[]).map(device=>{
        //set filters initial store
        this.$set(this.ethSelect,device.ip,{selected:true,filtered:true});
        const vendor=device?.vendor;
        if(vendor){
          const isHuawei=vendor==='HUAWEI';
          //this.$set(this.filterByVendor,vendor,{label:`${isHuawei?'только не ':''}${vendor}`,state:false,invert:isHuawei});
          this.$set(this.filterByVendor,vendor,{label:vendor,state:false});
        };
        const entrance_number=device?.filter?.entrance_number;
        if(entrance_number){
          this.$set(this.filterByEntrance,entrance_number,{label:`подъезд №${entrance_number}`,state:false});
        };
        const floor_name=device?.filter?.floor_name;
        if(floor_name){
          const off_floor={'Чердак':'на чердаке','Технический этаж':'на тех.этаже','Подвал':'в подвале'}[floor_name];
          this.$set(this.filterByFloor,floor_name,{label:off_floor||`этаж ${floor_name}`,state:false});
        };
        for(const entrance of device?.filter?.entrances||[]){
          const state=this.selectedEntrance?.id==entrance.id;
          this.$set(this.filterByEntrances,entrance.number/*+'_'+entrance.range*/,{label:`подъезд №${entrance.number} (кв. ${entrance.range})`,state});
        };
        return device;
      }).sort((a,b)=>{//sort by ip octets
        const a12=a.ip.split('.').map(oct=>oct.padStart(3,0)).join('');
        const b12=b.ip.split('.').map(oct=>oct.padStart(3,0)).join('');
        return parseInt(a12)-parseInt(b12);
      });
    },
    noEth(){
      return !this.ethDevices.length;
    },
    allPorts(){
      let allPorts=[];
      for(let devicename in this.ports.savedPorts||{}){
        allPorts.push({
          ...this.ports.savedPorts[devicename],
          ports:(this.ports.savedPorts[devicename].ports||[]).map(port=>{
            return {
              port,
              device:this.ports.savedPorts[devicename].device,
              key:this.ports.savedPorts[devicename].ip+':'+port.index_iface+':'+port.iface
            };
          }),
        });
        this.$set(this.showDevicePorts,devicename,this.showDevicePorts[devicename]||false);
      };
      return allPorts.sort((a,b)=>parseInt(a.ip.split('.')[3])-parseInt(b.ip.split('.')[3]));//sorted by ip
    },
    allPortsCount(){
      return Object.keys(this.ports.savedPorts||{}).map(device_name=>this.ports.savedPorts[device_name].ports||[]).flat().length
    },
    changedPortsByDevices(){//group by ip
      if(!this.ports.changedPorts){return};
      return this.ports.changedPorts.reduce((groups,changedPort,i)=>{
        const {port,device={},key=i}=changedPort;
        const {ip,name}=device;
        this.$set(this.showDevicePortsChanged,name,this.showDevicePortsChanged[name]||true);
        return {
          ...groups,
          [ip]:{
            ...device,
            ports:[
              ...groups[ip]?.ports||[],
              changedPort
            ]
          }
        }
      },{})
    },
    titleText(){return `Поиск ${this.saveData.cableTest?'кабеля в':'линка на'} порту`},
    totalCount(){return this.ethDevices.length},
    selectedCount(){return this.filteredAndSelectedEthDevices.length},
    titleText2(){return `${this.selectedCount||0} из ${this.totalCount||0}`},
    titleText2Class(){return `tone-500 ${(this.selectedCount!=this.totalCount)&&'bg-main-lilac-light border-radius-4px padding-left-right-4px'}`},
    selectedTest(){return `выбрано ${this.selectedCount||0} из ${this.totalCount||0} устройств`},
    savedText(){return `Сохранение портов прошло успешно в ${this.saveTime}, опрошено ${this.saveData.savedCount||0} устройств`},
    comparedText(){return `Сравнение портов прошло успешно, изменилось ${this.saveData.changedCount||0} порта`},
  },
  methods: {
    update_port_status(prefix,device_name){
      if(!prefix){return};
      const regexp=new RegExp('^'+prefix+(device_name?('('+device_name+')$'):''))
      const refs=Object.keys(this.$refs).reduce((refs,key)=>{
        const ref=this.$refs[regexp.test(key)?key:null];
        if(!ref?.length){return refs};
        return [...refs,...ref]
      },[]);
      for(const find_port of shuffle(refs||[])){
        if(find_port?.update_port_status){find_port.update_port_status()};
      };
    },
    toggleSelectAll(){//выбрать/не выбрать по всем
      for(let ip in this.ethSelect){
        this.$set(this.ethSelect,ip,{
          ...this.ethSelect[ip],
          selected:this.selectAll
        });
        this.setSelect(ip);
      };
    },
    setSelect(ip=''){//применяем селектор selected по ip
      this.$set(this.ethSelect,ip,{
        ...this.ethSelect[ip],
        selected:this.ethSelect[ip].selected
      });
      this.selectAll=this.ethSelect[ip].selected||this.selectAll;//переключаем если выбрали хоть один
    },
    async fetchPortStatuses() {
      //TODO: бекенд должен принимать новую структуру с name
      const devices=this.filteredAndSelectedEthDevices.map(device=>({...device,DEVICE_NAME:device.name}));
      let response={};
      try{
        response=await httpPost('/call/hdm/port_statuses?_devices='+devices.map(device=>device.ip).join(), {
          devices,
          add:this.saveData.cableTest?'cable':'speed',
        });
      }catch(error){
        console.warn('port_statuses.error',error);
      };
      for(let deviceName in response){//для port-find-el
        let device=response[deviceName];
        response[deviceName]={
          ...device,
          device:devices.find(ne=>ne.name==device.name&&ne.ip==device.ip),
        };
      };
      return response;
    },
    async getPortStatuses(action = 'save') {
      this.showSelect=false;//закрываем фильтр чтоб не мешал листать результаты
      const someLoading = Object.values(this.loading).some((val) => val);
      if (someLoading) return;
      if (action === 'save') this.resetData();

      this.loading[action] = true;
      const response = await this.fetchPortStatuses()
      this.loading[action] = false;

      if (action === 'save') this.actionSave(response);
      if (action === 'compare') this.actionCompare(response);
    },
    actionSave(response) {
      this.saveData = {
        time: new Date().toLocaleTimeString(),
        cableTest: this.saveData.cableTest,
        savedCount: this.countSavedPorts(response),
      };
      this.ports.savedPorts = response;
      this.saveCache();//add cache
    },
    actionCompare(response) {
      this.saveData.time = new Date().toLocaleTimeString();
      this.ports.comparedPorts = response;
      this.comparePorts();
      //перезаписываем сохраненные
      this.ports.savedPorts = { ...this.ports.comparedPorts };
      this.saveData.savedCount = this.countSavedPorts(this.ports.savedPorts);
      this.saveCache();//add cache
      this.showAll=false;//выключаем обратно просмотр всех
    },
    comparePorts(){
      const {savedPorts,comparedPorts}=this.ports;
      if(!comparedPorts||!savedPorts) return;

      const changedPorts = [];;
      for(const {name,ip,ports,device} of Object.values(savedPorts)){
        if(!ports) continue;
        for(const savedPort of ports){
          const comparedDevice=comparedPorts[name];
          const comparedDevicePorts=(comparedDevice&&comparedDevice.ports)||[];
          const comparedPort=comparedDevicePorts.find(p=>p.iface===savedPort.iface);
          if(!comparedPort){
            console.warn('Не найден порт для сравнения:',savedPort);
            continue;
          };
          if (this.portChanged(savedPort,comparedPort)){
            changedPorts.push({
              port:comparedPort,
              device,
              key:ip+':'+comparedPort.iface
            });
          };
        };
      };

      this.ports.changedPorts=changedPorts;
      this.saveData.changedCount=this.countChangedPorts();
      this.saveCache();
    },
    portChanged(savedPort, comparedPort) {
      if(this.showAllComparedPorts){return true};
      let diff = 0;
      if (savedPort.oper_state !== comparedPort.oper_state) diff++;

      if (this.saveData.cableTest) {
        for (let i = 1; i < 5; i++) {
          const pair = 'pair_' + i;
          const metr = 'mert_' + i;
          if (savedPort[pair]) {
            if (savedPort[pair] !== comparedPort[pair]) diff++;
            if (parseInt(savedPort[metr]) - parseInt(comparedPort[metr]) > 3) diff++;
          }
        }
      }
      return diff !== 0;
    },
    portName(port) {
      return encodeURIComponent(`PORT-${port.devicename}/${port.index_iface}`);
    },
    ipShort(ip=''){
      let octs=ip.split('.');
      if(octs.length<4){return ip};
      return `..${octs[2]}.${octs[3]}`;
    },
    resetData() {
      this.ports = { savedPorts: null, comparedPorts: null, changedPorts: null };
      this.saveData = { ...this.saveData, time: null };
    },
    countSavedPorts(devices) {
      let count = 0;
      if (!devices) return count;
      for (let deviceName in devices) {
        const { ports, message } = devices[deviceName];
        if (ports && ports.length && !message) count++;
      }
      return count;
    },
    countChangedPorts() {
      return (this.ports.changedPorts&&this.ports.changedPorts.length)||0;
    },
    saveCache(cacheKey=`port_statuses/${this.site_id}`){
      const {ports,saveData}=this;
      this.$cache.setItem(cacheKey,{ports,saveData},60);//1h
    },
    loadCache(cacheKey=`port_statuses/${this.site_id}`){
      const cache=this.$cache.getItem(cacheKey);
      if(!cache){return};
      const {ports,saveData}=cache;
      this.ports=ports;
      this.saveData=saveData;
    }
  },
});

Vue.component('FindPortItem',{
  template:`<div class="find-port-el">
    <div class="display-flex flex-direction-column gap-2px">
      <span :class="'ic-20 ic-loading rotating-'+leftOrRight+' main-lilac'" v-if="loads.port_status"></span>
      <span v-else @click="update_port_status_and_port_cable_test" class="ic-20 ic-status" :class="port_status.admin_state==='up'?(port_status.oper_state==='up'?'main-green':'tone-500'):'main-red'"></span>
      <span :class="'ic-20 ic-loading rotating-'+leftOrRight+' main-lilac'" v-if="portInfo_loading||loads.port_cable_test"></span>
    </div>
    <div class="find-port-c font--13-500" @click="toPort" :class="{'is-free':isFreeOrMaybeFree,[portClass]:true}">
      <div class="fp-c-iface" :class="{'is-free':isFreeOrMaybeFree}">{{port.iface}}</div>
      <div v-if="ifAlias" class="port-ifalias tone-650">{{ifAlias}}</div>
      <div v-if="portLast||lldpDevice||ipByMac" class="port-last" :class="portClass">{{lldpDevice||ipByMac||portLast}}</div>
      <div class="port-cable">
        <template v-if="!user_cable_test">
          <div v-for="i in [1,2,3,4]" :key="'pair_'+i" v-if="port['pair_'+i]">Пара {{i}}: {{port['pair_'+i]}} {{port['metr_'+i]}};</div>
        </template>
        <template v-else-if="port_cable_test">
          <div v-for="row of port_cable_test">{{row}}</div>
        </template>
        <loader-bootstrap v-else-if="loads.port_cable_test" text="testing ..." :height="loader_height"/>
      </div>
    </div>
    <button-sq icon="right-link" class="margin-left-auto" @click="toPort"/>
  </div>`,
  props:{
    changedPort:{type:Object,required:true},
  },
  data:()=>({
    loader_height:58,
    portInfo:{},
    portInfo_loading:false,
    loads:{
      neignbors:false,
      macs:false,
      port_status:false,
      port_cable_test:false,
    },
    resps:{
      neignbors:[],
      macs:[],
      port_status:null,
      port_cable_test:null,
    },
    user_cable_test:0,
  }),
  async created(){
    //await this.getPortStatus();
    await this.getPortInfo();
    if(this.portInfo.is_trunk||this.portInfo.state.includes('trunk')){
      if(this.portInfo.is_link){
        this.getLLDPNeignbors();
      }else{
        this.getMacNeignbors();
      };
      
    };
  },
  watch:{},
  computed:{
    port_cable_test(){
      return this.resps.port_cable_test
    },
    port_status(){
      return {
        admin_state:this.resps.port_status?.admin_state||this.port.admin_state,
        oper_state:this.resps.port_status?.oper_state||this.port.oper_state,
      }
    },
    loading(){
      return Object.values(this.loads).some(l=>l);
    },
    leftOrRight(){
      return randcode(1,'lr');
    },
    port(){
      return {
        ...this.changedPort.port,
        device:this.changedPort.device,
        name:this.changedPort.port.iface.split('/').reverse()[0].replaceAll(/\D/g,''),
      };
    },
    portName(){
      return `PORT-${this.changedPort.device.name}/${this.changedPort.port.index_iface}`;
    },
    portClass(){
      if(!this.portInfo.state){return ''};
      return `state--${(this.portInfo.state||'').replace(/ /g,'-')}`
    },
    ifAlias(){
      if(!this.portInfo.state){return };
      return (this.portInfo.snmp_description||'').includes('HUAWEI, Quidway Series,')?'':this.portInfo.snmp_description;
    },
    portLast(){
      if(!this.portInfo.state){return };
      if(!this.portInfo.last_mac||!this.portInfo.last_mac.last_at){return };
      let flatList=(this.portInfo.subscriber_list||[]).map(sub=>sub.flat);
      return [
        this.portInfo.last_mac.last_at.split(' ')[0],
        flatList.length?('кв. '+flatList.join(', ')+((flatList.length>1)?' ...':'')):this.portInfo.last_mac.value||'?',
      ].join(' • ');
    },
    lldpDevice(){
      if(this.loads.neignbors||!this.resps.neignbors?.length){return};
      const neignbor=this.resps.neignbors[0];
      return `${neignbor.LINK_DEVICE_NAME.split('_')[0].split('-')[0]}#${neignbor.LINK_DEVICE_NAME.split('_').reverse()[0]} • ${neignbor.LINK_DEVICE_IP_ADDRESS}`;
    },
    ipByMac(){
      if(this.loads.macs||!this.resps.macs?.length){return};
      return this.resps.macs.find(mac=>mac.CLIENT_IP&&mac.LAST_DATE&&mac.LAST_DATE.split(' ')[0]==new Date().toLocaleDateString())?.CLIENT_IP;
    },
    isFreeOrMaybeFree(){
      return !this.portInfo.is_trunk&&['free','double','closed','expired','move'].includes(this.portInfo?.state)
    }
  },
  methods:{
    update_port_status(){//public
      if(this.loads.port_status){return};
      this.getPortStatus();
    },
    async update_port_status_and_port_cable_test(){
      await this.getPortStatus();
      if(!this.portInfo?.is_link&&!this.portInfo?.is_trunk&&this.port_status?.oper_state!=='up'){
        this.getCableTest();
      }
    },
    async getCableTest() {
      this.loads.port_cable_test=true;
      this.resps.port_cable_test=null;
      this.user_cable_test++;
      try{
        const {number:PORT_NUMBER,snmp_name:SNMP_PORT_NAME}=this.portInfo||{};
        const {
          name:DEVICE_NAME,firmware:FIRMWARE,firmware_revision:FIRMWARE_REVISION,ip:IP_ADDRESS,
          region:{mr_id:MR_ID},patch_version:PATCH_VERSION,system_object_id:SYSTEM_OBJECT_ID,vendor:VENDOR
        }=this.port?.device||{};
        const response = await httpPost("/call/hdm/port_cable_test", {
          port:{PORT_NUMBER,SNMP_PORT_NAME},
          device:{DEVICE_NAME,FIRMWARE,FIRMWARE_REVISION,IP_ADDRESS,MR_ID,PATCH_VERSION,SYSTEM_OBJECT_ID,VENDOR},
        });
        if(Array.isArray(response.text)){
          this.resps.port_cable_test=response.text;
        }else{
          this.resps.port_cable_test=[response.text];
        };
      }catch (error){
        console.warn('port_cable_test.error',error);
      };
      this.loads.port_cable_test=false;
    },
    async getPortStatus(){
      const device=this.port?.devicename;
      if(!device){return};
      const port_ifindex=this.port?.index_iface;
      if(!port_ifindex){return};
      this.loads.port_status=true;
      this.resps.port_status=null;
      try{
        const response=await httpGet(buildUrl('port_status_by_ifindex',{device,port_ifindex},"/call/hdm/"));
        if(!response.code){
          this.resps.port_status=response;
        };
      }catch(error){
        console.warn('port_status.error', error);
      };
      this.loads.port_status=false;
    },
    async getPortInfo(){
      this.portInfo_loading=true;
      const cache=this.$cache.getItem(`port/${this.portName}`);
      if(cache){
        this.portInfo=cache;
      }else{
        try{
          const portInfo=await httpGet(buildUrl('search_ma',{
            pattern:encodeURIComponent(this.portName),
            component:'find-port-el'
          },'/call/v1/search/'));
          this.portInfo=portInfo.data;
          this.$cache.setItem(`port/${this.portName}`,portInfo.data);
        }catch(error){
          console.warn('search_ma.error',error);
        }
      };
      this.portInfo_loading=false;
    },
    async getLLDPNeignbors(){
      this.loads.neignbors=true;
      this.resps.neignbors=[];
      const cache=this.$cache.getItem(`port_info:neignbors/${this.portInfo.name}`);
      if(cache){
        this.resps.neignbors=cache;
      }else{
        try{
          const neignbors=await httpGet(buildUrl('port_info',{
            device:this.portInfo.device_name,
            port:this.portInfo.name,
            trunk:true,component:'find-port-el'
          }));
          this.resps.neignbors=neignbors.length?neignbors:[];
          this.$cache.setItem(`port_info:neignbors/${this.portInfo.name}`,this.resps.neignbors);
        }catch(error){
          console.warn('port_info.error', error);
        }
      }
      this.loads.neignbors=false;
    },
    async getMacNeignbors(){
      this.loads.macs=true;
      this.resps.macs=[];
      const cache=this.$cache.getItem(`port_info:macs/${this.portInfo.name}`);
      if(cache){
        this.resps.macs=cache;
      }else{
        try{
          const macs=await httpGet(buildUrl('port_info',{
            device:this.portInfo.device_name,
            port:this.portInfo.name,
            trunk:false,component:'find-port-el'
          }));
          this.resps.macs=macs.length?macs:[];
          this.$cache.setItem(`port_info:macs/${this.portInfo.name}`,this.resps.macs);
        }catch(error){
          console.warn('port_info.error', error);
        }
      }
      this.loads.macs=false;
    },
    toPort(){
      this.$router.push({
        name:'eth-port',
        params:{
          id:this.portName,
          ...this.portInfo.state?{
            portProp:this.portInfo
          }:null
        }
      });
    },
  },
});

//временно заблочено открытие так как неработает в ACS
Vue.component('CpeSetLanModal',{
  template:`<modal-container-custom name="CpeSetLanModal" ref="modal" @open="onModalOpen" @close="onModalClose" header :footer="false" :wrapperStyle="{'min-height':'auto','margin-top':'4px'}">
    <div class="margin-left-right-16px">
      <header class="margin-top-8px">
        <div class="font--18-600 tone-900 text-align-center">LAN</div>
        <div class="font--13-500 tone-500 text-align-center white-space-pre">{{$route.params.serial}} • {{$route.params.account}}</div>
      </header>
      
      <section class="margin-top-8px">
        <div class="display-flex align-items-center justify-content-space-between gap-4px">
          <div class="font--13-500" :class="[!dhcp&&'tone-500']">DHCP сервер</div>
          <switch-el class="width-40px" v-model="dhcp" :disabled="cpeUpdateLoading"/>
        </div>
      </section>
      
      <section class="margin-top-8px">
        <div>
          <input-el label="Начальный IP-адрес диапазона" v-model="config.lan_dhcp_min" :error="!!lan_dhcp_min_verifyText" :disabled="cpeUpdateLoading" inputmode="numeric"/>
          <input-error :text="lan_dhcp_min_verifyText"/>
        </div>
        <div>
          <input-el label="Конечный IP-адрес диапазона" v-model="config.lan_dhcp_max" :error="!!lan_dhcp_max_verifyText" :disabled="cpeUpdateLoading" inputmode="numeric"/>
          <input-error :text="lan_dhcp_max_verifyText"/>
        </div>
        <div>
          <input-el label="Маска подсети" v-model="config.lan_mask" :error="!!lan_mask_verifyText" :disabled="cpeUpdateLoading" inputmode="numeric"/>
          <input-error :text="lan_mask_verifyText"/>
        </div>
        <div>
          <input-el label="Локальный IP-адрес (LAN IP)" v-model="config.lan_ip" :error="!!lan_ip_verifyText" :disabled="cpeUpdateLoading" inputmode="numeric"/>
          <input-error :text="lan_ip_verifyText"/>
        </div>
      </section>
      
      <section class="margin-top-8px">
        <div class="display-flex align-items-center justify-content-space-between gap-4px">
          <div class="font--13-500" :class="[!igmp&&'tone-500']">IGMP прокси</div>
          <switch-el class="width-40px" v-model="igmp" :disabled="cpeUpdateLoading"/>
        </div>
      </section>
      
      <section class="margin-top-8px">
        <loader-bootstrap v-if="cpeUpdateLoading" text="применение настроек"/>
        <template v-else-if="cpeUpdateResult?.text">
          <message-el text="ошибка конфигурации" :subText="cpeUpdateResult?.message" type="warn" box class="margin-top-8px"/>
          <info-text-sec :text="cpeUpdateResult?.text" class="padding-left-right-0"/>
        </template>
        <message-el v-else-if="cpeUpdateResult?.key" text="конфигурирование успешно" type="success" box class="margin-top-8px"/>
      </section>
      
      <section class="display-flex align-items-center justify-content-space-between width-100-100 margin-top-16px">
        <button-main label="Закрыть" @click="close" buttonStyle="outlined" size="content" icon="close-1"/>
        <button-main label="Применить" @click="save" :disabled="!!verifyText||cpeUpdateLoading" buttonStyle="contained" size="content"/>
      </section>
    </div>
  </modal-container-custom>`,
  props:{
    mr_id:{type:[Number,String],required:true},
    serial:{type:[Number,String],required:true},
    account:{type:[Number,String],required:true},
  },
  data:()=>({
    dhcp:false,
    igmp:false,
    config:{
      dhcp_ena:null,
      igmp_ena:null,
      lan_dhcp_min:null,
      lan_dhcp_max:null,
      lan_mask:null,
      lan_ip:null
    }
  }),
  watch:{
    
  },
  computed:{
    ...mapGetters({
      cpe:'cpe/getCpeResult',
      cpeUpdateLoading:'cpe/doCpeUpdateLoading',
      cpeUpdateResult:'cpe/doCpeUpdateResult',
    }),
    initial(){
      const {lan_dhcp_min,lan_dhcp_max,lan_mask,lan_ip,dhcp_ena,igmp_ena}=this.cpe||{};
      return {
        dhcp_ena:dhcp_ena=='Up'?'Up':'Down',
        igmp_ena:igmp_ena=='Up'?'Up':'Down',
        lan_dhcp_min:lan_dhcp_min||'',
        lan_dhcp_max:lan_dhcp_max||'',
        lan_mask:lan_mask||'',
        lan_ip:lan_ip||'',
      }
    },
    lan_dhcp_min_verifyText(){return !ACS_CPE.testIp(this.config.lan_dhcp_min)?'Не верный формат IP':''},
    lan_dhcp_max_verifyText(){return !ACS_CPE.testIp(this.config.lan_dhcp_max)?'Не верный формат IP':''},
    lan_mask_verifyText(){return !ACS_CPE.testIp(this.config.lan_mask)?'Не верный формат IP':''},
    lan_ip_verifyText(){return !ACS_CPE.testIp(this.config.lan_ip)?'Не верный формат IP':''},
    verifyText(){return this.lan_dhcp_min_verifyText||this.lan_dhcp_max_verifyText||this.lan_mask_verifyText||this.lan_ip_verifyText},
  },
  methods:{
    open(){//public
      return;
      this.$refs.modal.open();
    },
    close(){//public
      this.$refs.modal.close();
    },
    onModalOpen(){
      this.init();
    },
    onModalClose(){
      this.reset('doCpeUpdate');
    },
    init(){
      const {lan_dhcp_min,lan_dhcp_max,lan_mask,lan_ip,dhcp_ena,igmp_ena}=this.initial;
      this.config.dhcp_ena=dhcp_ena;
      this.config.igmp_ena=igmp_ena;
      this.dhcp=this.config.dhcp_ena=='Up';
      this.igmp=this.config.igmp_ena=='Up';
      this.config.lan_dhcp_min=lan_dhcp_min;
      this.config.lan_dhcp_max=lan_dhcp_max;
      this.config.lan_mask=lan_mask;
      this.config.lan_ip=lan_ip;
    },
    ...mapActions({
      doCpeUpdate:'cpe/doCpeUpdate',
      getCpe:'cpe/getCpe',
    }),
    ...mapMutations({
      reset:'cpe/reset',
    }),
    async save(){
      this.config.dhcp_ena=this.dhcp?'Up':'Down';
      this.config.igmp_ena=this.igmp?'Up':'Down';
      await this.doCpeUpdate({
        ...this.$route.params,
        lan:ACS_CPE.getDiffParams(this.initial,this.config)
      });
      if(this.cpeUpdateResult?.key){
        this.getCpe(this.$route.params);
        this.reset('doCpeUpdate');
      }
    },
  },
});















//далее временные правки для тестирования замены КД RKD_test_path

//заглушки в логике выбора СЭ
Vue.component('SiteNetworkElements2',{
  template:`<CardBlock name="SiteNetworkElements2" class="display-flex flex-direction-column gap-8px">
    <template v-if="countRacksWithNetworkElements">
      <title-main icon="server" text="ШДУ с оборудованием" text2Class="tone-500" :text2="countRacksWithNetworkElements||''"/>
      <div v-for="({props:rackProps,networkElementsProps},rack_id) in racksProps" class="display-flex flex-direction-column gap-8px padding-left-right-16px">
        <RackBox2 :key="rack_id" v-bind="rackProps">
          <template v-for="({props,listeners},ne_id,i) in networkElementsProps">
            <devider-line v-if="i"/>
            <NetworkElementCard :key="ne_id" v-bind="props" v-on="listeners"/>
          </template>
        </RackBox2>
      </div>
    </template>
    <template v-if="countNetworkElementsNotInRack">
      <title-main icon="warning" text="Место установки неизвестно" text2Class="tone-500" :text2="countNetworkElementsNotInRack||''"/>
      <div v-for="({props,listeners},ne_id) in networkElementsProps" class="display-flex flex-direction-column gap-8px padding-left-right-16px">
        <NetworkElementCard :key="ne_id" v-bind="props" v-on="listeners"/>
      </div>
    </template>
  </CardBlock>`,
  props:{
    task_id:{type:String,required:true},
    site_id:{type:String,required:true},
  },
  data:()=>({
    auth_type:'',
    serverid:'',
  }),
  async created(){
    const {site_id,task_id}=this;
    //this.getRemedyWorkStages({task_id});//RKD_test_path
    this.getSiteNodes({site_id});
    this.getSiteEntrances({site_id});
    await this.getSiteRacks({site_id});
    await this.getSiteNetworkElements({site_id});
    this.startIpoeDetection();
  },
  computed:{
    ...mapGetters({
      getSiteById:'site/getSiteById',
      getEntrancesBySiteId:'site/getEntrancesBySiteId',
      getRacksBySiteId:'site/getRacksBySiteId',
      getNetworkElementsBySiteId:'site/getNetworkElementsBySiteId',
      getRemedyWorkStagesResultById:'remedy/getRemedyWorkStagesResultById',
      getRemedyWorkStagesLoadingById:'remedy/getRemedyWorkStagesLoadingById',
      getTaskById:'remedy/getTaskById',
    }),
    task(){return this.getTaskById(atok(this.task_id,this.site_id))},
    remedyWorkIsStarted(){return !!this.task?.started_at},
    site(){return this.getSiteById(this.site_id)},
    entrances(){return this.getEntrancesBySiteId(this.site_id)},
    racks(){return this.getRacksBySiteId(this.site_id)},
    networkElements(){return this.getNetworkElementsBySiteId(this.site_id)},
    networkElementsFiltered(){
      return select(this.networkElements,{
        ne_name:testByName.neIsETH,
        //node_name:testByName.nodeIsDu//RKD_test_path
      })
    },
    stagesLoading(){return this.getRemedyWorkStagesLoadingById(this.task_id)},
    stages(){return !this.stagesLoading?this.getRemedyWorkStagesResultById(this.task_id):null},
    racksProps(){
      const {task_id,remedyWorkIsStarted,serverid,isIpoe}=this;
      return Object.values(this.racks).reduce((racks,rack)=>{
        const {id,type,ne_in_rack}=rack;
        if(type!="Антивандальный"){return racks};
        racks[id]={
          props:{
            rack,
          },
          networkElementsProps:ne_in_rack?.reduce((networkElements,_name)=>{
            const ne=Object.values(this.networkElementsFiltered).find(({ne_name})=>ne_name==_name);
            if(!ne){return networkElements};
            const {ne_id,site_id,ne_status,ne_name}=ne;
            const isInstalled=testByName.neIsInstalled(ne_status);
            const isAvailToSelectAsSource=isInstalled&&remedyWorkIsStarted;
            networkElements[ne_id]={
              props:{
                ne_id,
                site_id,
                networkElementProps:ne,
                showAdminStatus:true,
                showSysDescr:true,
                showSysName:true,
                showServeEntrances:isInstalled,
                showFlatsAbons:isInstalled,
                replaced:neInStage(this.stages,ne_name)
              },
              listeners:{
                ...isAvailToSelectAsSource?{
                  click:()=>this.$router.push({
                    name:"network-element-source",
                    params:{
                      task_id,
                      site_id,
                      source_ne_id:ne_id,
                      networkElementProps:ne,
                      serverid:isIpoe?serverid:''
                    },
                  })
                }:null
              }
            };
            return networkElements;
          },{})
        };
        return racks
      },{})
    },
    networkElementsProps(){
      const {task_id,remedyWorkIsStarted,serverid,isIpoe}=this;
      return Object.values(this.networkElementsFiltered).reduce((networkElements,ne)=>{
        const {ne_id,site_id,rack_id,ne_status,ne_name}=ne;
        const isInstalled=testByName.neIsInstalled(ne_status);
        //const isAvailToStage=true||this.neIsAvailToStage(ne_name);
        const isAvailToSelectAsSource=isInstalled&&remedyWorkIsStarted;
        if(rack_id){return networkElements};
        networkElements[ne_id]={
          props:{
            ne_id,
            site_id,
            networkElementProps:ne,
            showBorder:true,
            showAdminStatus:true,
            showSysDescr:true,
            showSysName:true,
            showServeEntrances:isInstalled,
            showFlatsAbons:isInstalled,
            replaced:neInStage(this.stages,ne_name)
          },
          listeners:{
            ...isAvailToSelectAsSource?{
              click:()=>this.$router.push({
                name:"network-element-source",
                params:{
                  task_id,
                  site_id,
                  source_ne_id:ne_id,
                  networkElementProps:ne,
                  serverid:isIpoe?serverid:''
                },
              })
            }:null
          }
        };
        return networkElements;
      },{});
    },
    countRacksWithNetworkElements(){return Object.keys(this.racksProps).length},
    countNetworkElementsNotInRack(){return Object.keys(this.networkElementsProps).length},
    networkElementsInstalledNames(){
      return Object.values(this.networkElementsFiltered).reduce((names,ne)=>{
        const {ne_status,ne_name}=ne;
        if(testByName.neIsInstalled(ne_status)){
          names.push(ne_name);
        };
        return names;
      },[]);
    },
    isIpoe(){return /IPoE/i.test(this.auth_type||'')}
  },
  methods:{
    neIsAvailToStage(name){return true//RKD_test_path
      if(!this.stages){return};
      return !neInStage(this.stages,name);
    },
    ...mapActions({
      getSiteNodes:'site/getSiteNodes',
      getSiteEntrances:'site/getSiteEntrances',
      getSiteRacks:'site/getSiteRacks',
      getSiteNetworkElements:'site/getSiteNetworkElements',
      getRemedyWorkStages:'remedy/getRemedyWorkStages',
    }),
    async startIpoeDetection(){
      for(const name of this.networkElementsInstalledNames){
        const ports=await this.device_port_list(name);
        if(!ports?.length){continue};
        const subscribers=ports.map(({subscriber_list,name,flat,last_mac})=>{
          const account=subscriber_list.find(({account})=>account)?.account;
          //if(!account){console.warn({name,flat,account,last_mac:last_mac?last_mac.value:null,last_at:last_mac?last_mac.last_at:null})}
          return account
        }).filter(v=>v);
        if(!subscribers.length){continue};

        for(const account of subscribers){
          const account_data=await this.search_ma(account);
          if(!account_data){continue};

          const agreements=account_data?.lbsv?.data?.agreements||account_data?.lbsv?.data?.[0]?.agreements||[];
          const agreement=agreements?.find(({account:_account})=>_account==account);
          if(!agreement?.services?.internet?.vgroups){continue};

          const service_internet_active=agreement.services.internet.vgroups.find(({statusname})=>statusname=='Активна');
          if(!service_internet_active){continue};

          const {serverid,vgid,login}=service_internet_active;
          const auth_type=await this.get_auth_type({serverid,vgid,login});
          if(!auth_type){continue};
          this.auth_type=auth_type;
          this.serverid=serverid;
          break;
        };
        if(this.auth_type){break};
      };
    },
    async device_port_list(name){
      try{
        const cache=this.$cache.getItem(`device_port_list/${name}`);
        if(cache){
          return cache.response||[];
        }else{
          const response = await httpGet(buildUrl('device_port_list', {device:name}));
          if(!response?.length){
            return
          };
          this.$cache.setItem(`device_port_list/${name}`,{date:new Date(),response},60);
          for(const port of response){//т.к структура идентичная сваливаем порты в кэш
            this.$cache.setItem(`port/PORT-${name}/${port.snmp_number}`,port);
          };
          return response;
        };
      }catch(error){
        console.warn("device_port_list.error",error)
      };
      return
    },
    async search_ma(account){
      try{
        const response=await httpGet(buildUrl('search_ma',{pattern:account},'/call/v1/search/'));
        if(response?.data){
          return response.data;
        };
      }catch(error){
        console.warn("search_ma:account.error",error)
      };
      return
    },
    async get_auth_type({serverid,vgid,login}){
      try{
        const response=await httpGet(buildUrl('get_auth_type',{serverid,vgid,login},'/call/aaa/'));
        if(response?.code==200&&response?.data?.[0].auth_type){
          return response.data[0].auth_type;
        }
      }catch(error){
        console.warn("get_auth_type.error",error)
      };
      return
    }
  },
});
Vue.component('SiteNetworkElementsPlanned2',{
  template:`<CardBlock name="SiteNetworkElementsPlanned2">
    <title-main icon="server" text="Заменить на новый коммутатор" text2Class="tone-500" :text2="countNetworkElementsPlanned||''" @open="opened=!opened"/>
    <div v-show="opened" class="display-flex flex-direction-column gap-8px padding-left-right-16px-">
      <message-el v-if="!notSelectableTargetNetworkElements" type="info" text="Выберите новый коммутатор" box @click="unselect"/>
      
      <template v-if="countRacksWithNetworkElements">
        <title-main icon="server" text="ШДУ с оборудованием" text2Class="tone-500" :text2="countRacksWithNetworkElements||''"/>
        <div v-for="({props:rackProps,networkElementsProps},rack_id) in racksProps" class="display-flex flex-direction-column gap-8px padding-left-right-16px">
          <RackBox2 :key="rack_id" v-bind="rackProps">
            <template v-for="({props,listeners},ne_id,i) in networkElementsProps">
              <devider-line v-if="i"/>
              <NetworkElementCard :key="ne_id" v-bind="props" v-on="listeners"/>
            </template>
          </RackBox2>
        </div>
      </template>
      <template v-if="countNetworkElementsNotInRack">
        <title-main icon="warning" text="Место установки неизвестно" text2Class="tone-500" :text2="countNetworkElementsNotInRack||''"/>
        <div v-for="({props,listeners},ne_id) in networkElementsProps" class="display-flex flex-direction-column gap-8px padding-left-right-16px">
          <NetworkElementCard :key="ne_id" v-bind="props" v-on="listeners"/>
        </div>
      </template>

      <div class="display-flex padding-left-right-16px">
        <button-main v-if="!notSelectableTargetNetworkElements" label="Выбрать новый коммутатор" @click="goToSelected" :disabled="!selected_ne_id||!countNetworkElementsPlanned" buttonStyle="contained" size="full"/>
      </div>
    </div>
    <SelectedNetworkElementPlannedModal v-if="!notSelectableTargetNetworkElements&&selected_ne_id" v-bind="{target_ne_id:selected_ne_id,source_ne_id,task_id,next_stage_id,serverid}" ref="SelectedNetworkElementPlannedModal"/>
  </CardBlock>`,
  props:{
    task_id:{type:String,required:true},
    site_id:{type:String,required:true},
    source_ne_id:{type:String},//коммутатор источник привязок
    next_ne_id:{type:String,default:''},//автовыделенный коммутатор
    serverid:{type:[Number,String],default:''},
    notSelectableTargetNetworkElements:{type:Boolean,default:false},
  },
  data:()=>({
    opened:true,
    selected_ne_id:null
  }),
  async created(){
    this.selected_ne_id=this.next_ne_id||this.selected_ne_id;//9154819735513194600
    const {site_id,stages,task_id}=this;
    if(!stages?.length){
      //this.getRemedyWorkStages({task_id});//RKD_test_path
    };
    this.getSiteNodes({site_id});
    this.getSiteEntrances({site_id});
    await this.getSiteRacks({site_id});
    this.getSiteNetworkElements({site_id});
    //this.getSiteNetworkElementsPlanned({site_id});
  },
  computed:{
    ...mapGetters({
      getSiteById:'site/getSiteById',
      getEntrancesBySiteId:'site/getEntrancesBySiteId',
      getRacksBySiteId:'site/getRacksBySiteId',
      getNetworkElementsBySiteId:'site/getNetworkElementsBySiteId',
      //getNetworkElementsPlannedBySiteId:'site/getNetworkElementsPlannedBySiteId',
      getRemedyWorkStagesResultById:'remedy/getRemedyWorkStagesResultById',
      getRemedyWorkStagesLoadingById:'remedy/getRemedyWorkStagesLoadingById',
    }),
    site(){return this.getSiteById(this.site_id)},
    entrances(){return this.getEntrancesBySiteId(this.site_id)},
    racks(){return this.getRacksBySiteId(this.site_id)},
    networkElements(){return this.getNetworkElementsBySiteId(this.site_id)},
    //networkElements(){return this.getNetworkElementsPlannedBySiteId(this.site_id)},
    networkElementsFiltered(){
      return select(this.networkElements,{
        ne_name:testByName.neIsETH,
        //node_name:testByName.nodeIsDu,//RKD_test_path
        //ne_status:testByName.statusIsP//RKD_test_path
      })
    },
    stagesLoading(){return this.getRemedyWorkStagesLoadingById(this.task_id)},
    stages(){return !this.stagesLoading?this.getRemedyWorkStagesResultById(this.task_id):null},
    next_stage_id(){return 1/*||Array.isArray(this.stages)?this.stages.length:-1*/},//RKD_test_path
    networkElementsProps(){
      return Object.values(this.networkElementsFiltered).reduce((networkElements,ne)=>{
        const {ne_id,site_id,rack_id,ne_name}=ne;
        const isAvailToSelectAsTarget=this.neIsAvailToStage(ne_name)&&!this.notSelectableTargetNetworkElements;
        if(rack_id){return networkElements};
        networkElements[ne_id]={
          props:{
            ne_id,
            site_id,
            networkElementProps:ne,
            showBorder:true,
            showAdminStatus:true,
            showSysDescr:true,
            showSysName:true,
            selected:this.selected_ne_id==ne_id,
            showServeEntrances:true,
            showFlatsAbons:true,
          },
          listeners:{
            ...isAvailToSelectAsTarget?{
              click:()=>{this.selected_ne_id=ne_id}
            }:null
          }
        };
        return networkElements
      },{});
    },
    racksProps(){
      return Object.values(this.racks).reduce((racks,rack)=>{
        const {id,type,ne_in_rack}=rack;
        if(type!="Антивандальный"){return racks};
        racks[id]={
          props:{
            rack,
          },
          networkElementsProps:ne_in_rack?.reduce((networkElements,_name)=>{
            const ne=Object.values(this.networkElementsFiltered).find(({ne_name})=>ne_name==_name);
            if(!ne){return networkElements};
            const {ne_id,site_id,ne_name}=ne;
            const isAvailToSelectAsTarget=this.neIsAvailToStage(ne_name)&&!this.notSelectableTargetNetworkElements;
            networkElements[ne_id]={
              props:{
                ne_id,
                site_id,
                networkElementProps:ne,
                showAdminStatus:true,
                showSysDescr:true,
                showSysName:true,
                selected:this.selected_ne_id==ne_id,
                showServeEntrances:true,
                showFlatsAbons:true,
              },
              listeners:{
                ...isAvailToSelectAsTarget?{
                  click:()=>{this.selected_ne_id=ne_id}
                }:null
              }
            };
            return networkElements;
          },{})
        };
        return racks
      },{})
    },
    countNetworkElementsPlanned(){return Object.keys(this.networkElementsFiltered).length},
    countRacksWithNetworkElements(){return Object.keys(this.racksProps).length},
    countNetworkElementsNotInRack(){return Object.keys(this.networkElementsProps).length},
  },
  methods:{
    neIsAvailToStage(name){return true//RKD_test_path
      if(!this.stages){return};
      return !neInStage(this.stages,name);
    },
    ...mapActions({
      getSiteNodes:'site/getSiteNodes',
      getSiteEntrances:'site/getSiteEntrances',
      getSiteRacks:'site/getSiteRacks',
      getSiteNetworkElements:'site/getSiteNetworkElements',
      //getSiteNetworkElementsPlanned:'site/getSiteNetworkElementsPlanned',
      getRemedyWorkStages:'remedy/getRemedyWorkStages',
    }),
    unselect(){this.selected_ne_id=''},
    goToSelected(){
      if(!this.selected_ne_id){return};
      if(!this.$refs.SelectedNetworkElementPlannedModal){return};
      this.$refs.SelectedNetworkElementPlannedModal.open();
    },
  },
});

//clear error text for retry
Vue.component('SelectedNetworkElementPlannedModal',{
  template:`<modal-container-custom ref="modal" :footer="false" :wrapperStyle="{'min-height':'auto'}">
      <div class="margin-left-16px margin-right-16px display-flex flex-direction-column gap-16px">
      
        <loader-bootstrap v-if="(loaderText||(loaderText&&someLoading))&&!errorText" :text="loaderText"/>
        <icon-80 class="margin-auto" v-else-if="iconProps" v-bind="iconProps"/>
        <message-el v-if="errorText" :text="errorText" type="warn" class="margin-auto"/>

        <div class="display-flex align-items-center gap-4px margin-auto">
          <PingLed v-bind="{ip,mr_id,noPingOnCreated:true}" ref="PingLed"/>
          <span class="font--16-700" :class="ipClassByPingState">{{prefix}}</span>
          <span class="font--16-700" :class="ipClassByPingState">{{ip}}</span>
        </div>
        <div class="margin-auto">
          <div class="font--13-500 text-align-center">{{sysNameText}}</div>
          <div class="font--12-400">{{sysDescr}}</div>
        </div>

        <button-main label="Выбрать" @click="startReconnect" :disabled="!!loaderText||someLoading||neNotAvail||no_next_stage_id" :loading="!!loaderText||someLoading" buttonStyle="contained" size="full"/>
      </div>
      <div class="margin-top-16px display-flex justify-content-space-around">
        <button-main label="Закрыть" @click="close" buttonStyle="outlined" size="medium"/>
      </div>
  </modal-container-custom>`,
  props:{
    target_ne_id:{type:String,required:true},
    source_ne_id:{type:String,required:true},
    task_id:{type:String,required:true},
    next_stage_id:{type:Number,required:true,default:-1},
    serverid:{type:[Number,String],default:''},
  },
  data:()=>({
    loads:{
      doDiscovery:false,
      doDiscoveryExt:false,
    },
    resps:{
      doDiscovery:null,
      doDiscoveryExt:null,
    },
    errorText:'',
    loaderText:'',
    iconPresets:{
      loading:{icon:'loading rotating',bgColor:'bg-main-lilac-light',icColor:'main-lilac'},
      success:{icon:'checkmark',bgColor:'bg-attention-success',icColor:'main-green'},
      warning:{icon:'warning',bgColor:'bg-attention-warning',icColor:'main-orange'},
    },
    iconProps:null,
  }),
  watch:{
    'pingState'(pingState){
      if(pingState=='online'&&!this.sysObjectID&&!this.loaderText){
        this.startDiag();
      }
    },
    'errorText'(errorText){
      if(errorText){
        this.loaderText='';
      }
    }
  },
  created(){},
  computed:{
    ...mapGetters({
      //getSiteNetworkElementPlannedById:'site/getSiteNetworkElementPlannedById',
      getSiteNetworkElementById:'site/getSiteNetworkElementById',
    }),
    networkElement(){return /*this.getSiteNetworkElementPlannedById(this.target_ne_id)||*/this.getSiteNetworkElementById(this.target_ne_id)},
    site_id(){return this.networkElement?.site_id},
    mr_id(){return this.networkElement?.mr_id},
    ne_id(){return this.networkElement?.ne_id},
    ne_name(){return this.networkElement?.ne_name},
    ip(){return this.networkElement?.ip},
    snmp_community(){return this.networkElement?.snmp_community},
    snmp_version(){return this.networkElement?.snmp_version},
    vendor(){return this.networkElement?.vendor||''},
    model(){return this.networkElement?.model||''},
    sysName(){return this.networkElement?.sysName||''},
    sysDescr(){return this.networkElement?.sysDescr||''},
    sysObjectID(){return this.networkElement?.sysObjectID||''},

    prefix(){return getNetworkElementPrefix(this.ne_name||'')},
    isETH(){return testByName.neIsETH(this.ne_name)},
    modelText(){
      const {vendor,model,sysObjectID}=this;
      return getModelText(vendor,model,sysObjectID);
    },
    sysNameText(){
      const {sysName,ne_name,ip}=this;
      return getSysNameText(sysName,ne_name,ip);
    },
    ...mapGetters({
      getPingResult:'ping/getPingResult',
      getPingLoading:'ping/getPingLoading',
    }),
    pingState(){const {mr_id,ip}=this;return this.getPingResult(mr_id,ip)?.state},
    pingLoading(){const {mr_id,ip}=this;return this.getPingLoading(mr_id,ip)},
    ipClassByPingState(){
      switch(this.pingLoading||this.pingState){
        case 'error':return 'main-orange';
        case 'online':return 'main-green';
        case 'offline':return 'main-red';
      };
    },
    someLoading(){
      return Object.values(this.loads).some(v=>v)||this.pingLoading;
    },
    neNotAvail(){
      return [this.pingState!=='online',!this.snmp_version,!this.snmp_community,!this.sysObjectID].some(v=>v)
    },
    no_next_stage_id(){return this.next_stage_id<0},
    ...mapGetters({
      addRemedyWorkStageResultByKey:'remedy/addRemedyWorkStageResultByKey',
      addRemedyWorkStageLoadingByKey:'remedy/addRemedyWorkStageLoadingByKey',
      clientsReconnectResultByKey:'xrad/clientsReconnectResultByKey',
      clientsReconnectLoadingByKey:'xrad/clientsReconnectLoadingByKey',
      getPingResult:'ping/getPingResult',
    }),
  },
  methods:{
    open(){//public
      this.$refs.modal.open();
      this.startDiag();
    },
    close(){//public
      this.$refs.modal.close()
    },
    async startDiag(){
      //this.iconProps=this.iconPresets.loading;
      if(!this.ip){
        this.errorText='не заполнен ip адрес';
        this.iconProps=this.iconPresets.warning;
        return
      };

      this.loaderText='проверка доступности';
      await this.$refs.PingLed?.ping();
      if(this.pingState!='online'){
        this.errorText='устройство не доступно';
        this.iconProps=this.iconPresets.warning;
        return
      };

      this.errorText='';
      this.iconProps=this.iconPresets.success;

      if(!this.snmp_version||!this.snmp_community){
        this.errorText='не заполнены реквизиты snmp';
        this.iconProps=this.iconPresets.warning;
        return
      };

      if(this.sysObjectID){
        this.loaderText='';
        this.errorText='';
        this.iconProps=this.iconPresets.success;
        return
      }

      this.loaderText='опрос устройства';
      await this.doDiscovery();
      if(this.resps.doDiscovery?.code!='200'){
        this.errorText='устройство не опрошено';
        this.iconProps=this.iconPresets.warning;
        return
      };

      this.errorText='';
      this.iconProps=this.iconPresets.success;

      this.loaderText='обновление устройства';
      //await this.getNetworkElement();//TODO: нет метода получения СЭ в статусе планируется
      const {site_id}=this;
      //await this.getSiteNetworkElementsPlanned({site_id,update:true});
      await this.getSiteNetworkElements({site_id,update:true});
      if(!this.sysObjectID){
        this.errorText='устройство не опросилось';
        this.iconProps=this.iconPresets.warning;
        return
      };

      this.loaderText='';
      this.errorText='';
      this.iconProps=this.iconPresets.success;
    },
    async doDiscovery(){
      const {mr_id,ne_name,ip,sysObjectID,vendor,snmp_version,snmp_community}=this;
      const device={
        ip,mr_id,
        MR_ID:mr_id,DEVICE_NAME:ne_name,IP_ADDRESS:ip,
        SYSTEM_OBJECT_ID:sysObjectID,VENDOR:vendor,
        SNMP_VERSION:snmp_version,SNMP_COMMUNITY:snmp_community,
      };
      this.loads.doDiscovery=true;
      this.resps.doDiscovery=null;
      try{
        const result=await httpPost(buildUrl('dev_discovery',{ip,mr_id},'/call/hdm/'),{device});
        this.resps.doDiscovery=result;
      }catch(error){
        console.warn('dev_discovery.error',error);
      };
      this.loads.doDiscovery=false;
    },
    async doDiscoveryExt(){
      const {mr_id,ne_name,ip,sysObjectID,vendor,snmp_version,snmp_community}=this;
      const device={
        ip,mr_id,
        MR_ID:mr_id,DEVICE_NAME:ne_name,IP_ADDRESS:ip,
        SYSTEM_OBJECT_ID:sysObjectID,VENDOR:vendor,
        SNMP_VERSION:snmp_version,SNMP_COMMUNITY:snmp_community,
      };
      this.loads.doDiscoveryExt=true;
      this.resps.doDiscoveryExt=null;
      try{
        const result=await httpPost(buildUrl('dev_discovery_ext',{ip,mr_id},'/call/hdm/'),{device});
        this.resps.doDiscoveryExt=result;
      }catch(error){
        console.warn('dev_discovery_ext.error',error);
      };
      this.loads.doDiscoveryExt=false;
    },
    async startReconnect(){
      this.loaderText='';
      this.errorText='';
      const {target_ne_id,networkElement,site_id,task_id,source_ne_id,no_next_stage_id,serverid}=this;
      if(no_next_stage_id){
        this.errorText='Невозможно произвести замену СЭ';
        this.iconProps=this.iconPresets.warning;
        return
      };

      const sourceNetworkElement=/*this.getSiteNetworkElementPlannedById(source_ne_id)||*/this.getSiteNetworkElementById(source_ne_id);
      if(!sourceNetworkElement?.ne_name){
        this.errorText='Нет демонтируемого СЭ';
        this.iconProps=this.iconPresets.warning;
        return
      };

      //12
      this.loaderText=`Замена СЭ ${sourceNetworkElement.ip} на СЭ ${this.ip} в рамках работы ${task_id}`;
      const old_device_name=sourceNetworkElement.ne_name;
      const new_device_name=this.ne_name;
      await this.addRemedyWorkStage({task_id,old_device_name,new_device_name});
      const addRemedyWorkStageKey=atok(task_id,old_device_name,new_device_name);
      const addRemedyWorkStageResult=this.addRemedyWorkStageResultByKey(addRemedyWorkStageKey);
      if(!addRemedyWorkStageResult){
        this.errorText=`Ошибка замены СЭ ${sourceNetworkElement?.ip} на СЭ ${this.ip}`;
        this.iconProps=this.iconPresets.warning;
        return
      };
      console.log({addRemedyWorkStageKey,addRemedyWorkStageResult});
      
      this.loaderText=`Проверка замены СЭ ${sourceNetworkElement.ip} на СЭ ${this.ip}`;
      await this.getRemedyWorkStages({task_id});
      
      this.loaderText=`Расширенный опрос СЭ ${this.ip}`;
      await this.doDiscoveryExt();
      if(this.resps.doDiscoveryExt?.code!=200){
        this.errorText=`Ошибка опроса СЭ ${this.ip}`;
        this.iconProps=this.iconPresets.warning;
        return
      };

      if(serverid){//is IPoE
        const {ip,mr_id}=sourceNetworkElement;
        this.loaderText=`Проверка доступности СЭ ${ip}`;
        await this.doPing({mr_id,ip});
        const oldNePingResult=this.getPingResult(mr_id,ip);
        if(oldNePingResult?.state!=='offline'){
          this.errorText=`Демонтируемый СЭ ${ip} ${oldNePingResult?.state}`;
          this.iconProps=this.iconPresets.warning;
          return
        }else{
          this.loaderText='Переподключение абонентов IPoE';
          await this.clientsReconnect({task_id,serverid,old_device_name});
          if(false&&this.clientsReconnectResultByKey(atok(task_id,serverid,old_device_name))==='OK'){
            this.errorText='Ошибка переподключения абонентов IPoE';
            this.iconProps=this.iconPresets.warning;
            return
          };
        };
      };

      const today=new Date().toLocaleDateString('ru',{year:'2-digit',month:'2-digit',day:'2-digit'});
      
      this.loaderText=`Ввод нового СЭ ${this.ip} в эксплуатацию`;
      try{
        const response=await httpPost('/call/nioss/set_nioss_object',{
          object_id:this.ne_id,
          object_fields:[
            {"FakticheskayaDataGotovnostiKNachaluTE":today},
          ]
        });
        if(response!=='OK'){
          this.errorText=`Ошибка ввода нового СЭ ${this.ip} в эксплуатацию. ${response?.text||''}`;
          return//{type: 'error', code: 400, message: 'Bad Request', text: 'Превышено время ожидания SOAP запроса.'}
        };
      }catch(error){
        console.warn('set_nioss_object.error',error);
        this.errorText=`Неизвестная ошибка ввода нового СЭ ${this.ip} в эксплуатацию`;
        return
      };

      this.loaderText=`Перевод старого СЭ ${sourceNetworkElement.ip} в демонтаж`;
      try{
        const response=await httpPost('/call/nioss/set_nioss_object',{
          object_id:sourceNetworkElement.ne_id,
          object_fields:[
            {"FakticheskayaDataNachalaDemontazha":today},
          ]
        });
        if(response!=='OK'){
          this.errorText=`Ошибка перевода старого СЭ ${sourceNetworkElement.ip} в демонтаж. ${response?.text||''}`;
          return//{type: 'error', code: 400, message: 'Bad Request', text: 'Превышено время ожидания SOAP запроса.'}
        };
      }catch(error){
        console.warn('set_nioss_object.error',error);
        this.errorText=`Неизвестная ошибка перевода старого СЭ ${sourceNetworkElement.ip} в демонтаж`;
        return
      };
      
      this.loaderText=`Обновление нового СЭ ${this.ip}`;
      await this.getSiteNetworkElements({site_id,update:true});

      this.loaderText='';
      this.errorText='';
      this.iconProps=this.iconPresets.success;
      
      this.$router.push({
        name:"network-element-target",
        params:{
          task_id,
          site_id,
          source_ne_id:sourceNetworkElement.ne_id,
          target_ne_id,
          targetNetworkElementProps:networkElement,
          sourceNetworkElementProps:sourceNetworkElement,
        },
      });
    },
    ...mapActions({
      getSiteNetworkElements:'site/getSiteNetworkElements',
      //getSiteNetworkElementsPlanned:'site/getSiteNetworkElementsPlanned',
      addRemedyWorkStage:'remedy/addRemedyWorkStage',
      getRemedyWorkStages:'remedy/getRemedyWorkStages',
      clientsReconnect:'xrad/clientsReconnect',
      doPing:'ping/doPing',
    }),
  },
});

//remove old modals
Vue.component('RemedyTaskContentMain',{
  template:`<div name="RemedyTaskContentMain">
    <CardBlock>
      <title-main icon="task" text="Работа">
        <div class="display-flex align-items-center margin-right-12px gap-4px font--13-500" v-if="remedyWorkIsStarted">
          <span v-if="isOver" class="tone-500">просрочен</span>
          <template v-else>
            <span class="tone-500">Осталось:</span>
            <span class="white-space-nowrap">{{leftTime}} (c {{startTime}})</span>
          </template>
          <i class="ic-20 ic-timer tone-500"></i>
        </div>
      </title-main>
      <devider-line />

      <link-block :text="task_id" @click="copy(task_id)" actionIcon="copy" type="medium"/>
      <devider-line />

      <info-text-sec title="Описание работ" :rows="workDescriptionRows" class="margin-left-16px margin-bottom-8px"/>
      <RemedyTaskCounters v-bind="{countEth,countAbons}" class="margin-left-16px margin-right-16px"/>
      <devider-line />

      <RemedyTaskStatusAndFio :icon="statusIcon" :status="task.status" :persname2="persname2" class="margin-left-16px margin-right-16px"/>

      <div class="margin-left-16px margin-right-16px margin-top-8px">
        <button-main :label="changeStatusProps.buttonText" @click="$refs.ChangeRemedyTaskStatusModal.open()" buttonStyle="contained" size="full"/>
      </div>
    </CardBlock>
    
    <ChangeRemedyTaskStatusModal ref="ChangeRemedyTaskStatusModal" v-bind="changeStatusProps"/>

    <CardBlock v-if="siteNode">
      <title-main :text="shortAddress" class="margin-top-8px">
        <button-sq type="large" icon="pin" @click="toMap"/>
      </title-main>
      <devider-line />
      
      <link-block icon="du" :text="siteNode.name||site_id" :search="siteNode.node||site_id" type="medium"/>
      <RemedyTaskEntrancesLine v-bind="{entrances}" class="margin-left-16px margin-right-16px"/>
      <link-block icon="home" text="Инфо по площадке и доступу" @block-click="$refs.SiteNodeDetailsModal.open()" actionIcon="expand" type="medium"/>
    </CardBlock>

    <modal-container ref="SiteNodeDetailsModal">
      <SiteNodeDetails :siteNode="siteNode"/>
    </modal-container>
  </div>`,
  props:{
    task_id:{type:String,required:true},
    task_site_id:{type:String,required:true},
  },
  data:()=>({
    loads:{
      siteNode:false,
    },
    resps:{
      siteNode:null,
    },
  }),
  computed:{
    ...mapGetters({
      getTaskById:'remedy/getTaskById',
    }),
    task(){return this.getTaskById(atok(this.task_id,this.task_site_id))},
    statusIcon(){return REMEDY_TASK_STATUSES.find(({name})=>name===this.task.status)?.icon||''},
    workDescriptionRows(){return [this.task.classificatorcause,this.task.work,this.task.work_description]},
    persname2(){return this.task.persname2||''},
    site_id(){return this.siteNode?.id||this.task.site_id},
    siteNode(){return this.resps.siteNode},
    shortAddress(){return truncateSiteAddress(this.resps.siteNode?.address||this.task.location||'')},
    countEth(){return this.task.ne_quantity||0},
    countAbons(){return this.task.count_cp||0},
    entrances(){return this.task.entrances||[]},//нет данных по подъездам [1,2,3,5,6,8]
    time(){return getRemedyTimeStartEndByTask(this.task)},
    //remedyWorkIsStarted(){return !!this.task.started_at},
    startMs(){return this.task.startMs},
    deadlineMs(){return this.task.deadlineMs},
    isOver(){return this.task.countdownMs<=0},
    leftTime(){return msToLeftTime(this.task.countdownMs)},
    startTime(){return new Date(this.startMs).toLocaleTimeString()},
    countdownRunning(){return this.task.countdownRunning},
    countdownMs(){return this.task.countdownMs},
    remedyWorkIsCreated(){return this.task.status==REMEDY_TASK_STATUS_0},
    remedyWorkIsStarted(){return this.task.status==REMEDY_TASK_STATUS_4},
    changeStatusProps(){
      const {remedyWorkIsCreated,remedyWorkIsStarted,task_id,task_site_id}=this;
      if(remedyWorkIsCreated){
        return {
          task_id,task_site_id,nextStatus:REMEDY_TASK_STATUS_1,
          centerText:'Вы хотите изменить статус',
          buttonText:'Перевести в Назначен',
        }
      }else if(!remedyWorkIsStarted){
        return {
          task_id,task_site_id,nextStatus:REMEDY_TASK_STATUS_4,
          centerText:'Вы хотите взять в работу',
          buttonText:'Взять в работу',
        }
      }else{
        return {
          task_id,task_site_id,nextStatus:REMEDY_TASK_STATUS_5,
          centerText:'Вы хотите завершить работу',
          buttonText:'Завершить работу',
        }
      }
      
    }
  },
  created(){
    this.getSite();
    this.initTaskCountdown();
  },
  watch:{
    'remedyWorkIsStarted'(){
      this.initTaskCountdown();
    }
  },
  methods:{
    ...mapActions({
      startTaskCountdownById:'remedy/startTaskCountdownById'
    }),
    initTaskCountdown(){
      if(!this.remedyWorkIsStarted){return};
      if(this.countdownRunning){return};
      const {task_id,task_site_id,deadlineMs}=this;
      const countdownMs=deadlineMs-Date.now();
      this.startTaskCountdownById({id:atok(task_id,task_site_id),countdownMs});
    },
    async getSite(){
      const {site_id}=this;
      if(!site_id){return};
      let cache=this.$cache.getItem(`search_ma/${site_id}`);
      if(cache){
        this.resps.siteNode=selectNodeDuAsSite(cache);
        return;
      };
      try{
        let response=await httpGet(buildUrl("search_ma",{pattern:site_id},"/call/v1/search/"));
        if(response.type==='error'){throw new Error(response.message)};
        this.$cache.setItem(`search_ma/${site_id}`,response.data);
        this.resps.siteNode=selectNodeDuAsSite(response.data);
      }catch(error){
        console.warn('search_ma:siteNode.error',error);
      };
    },
    copy(text){
      copyToBuffer(text,()=>console.log('Copied:',text));
    },
    toMap(){
      const coordinates=this.siteNode?.coordinates||this.task.coordinates
      if(!coordinates){return};
      const {latitude:lat,longitude:long}=coordinates;
      this.$router.push({
        name:'map',
        query:{lat,long},
      });
    },
  },
});















