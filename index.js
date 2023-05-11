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

//fix get_params 1365
document.head.appendChild(Object.assign(document.createElement('script'),{src:'https://mypanty1.github.io/snow/fix_session_1365.js',type:'text/javascript'}));

//GreetingCard
document.head.appendChild(Object.assign(document.createElement('script'),{src:'https://mypanty1.github.io/snow/GreetingCard.js',type:'text/javascript'}));

//add trash icon for sw model to util for region 54
Vue.component('device-info',{
  template:`<article name="device-info" class="device-info" :class="[addBorder&&'border-gray']" :style="neIsNotInstalled?'background-color:#eeeeee;':''">
    <info-text-sec v-if="showLocation":text="networkElement?.region?.location" class="padding-left-right-unset margin-bottom-8px"/>
    
    <header class="device-info__header">
      <div class="device-info__status" :class="'device-info__status--'+status" @click="updatePing" :title="sysUpTime">
        <div :class="'ic-20 ic-'+(loading.ping?'loading rotating':'status')"></div>
      </div>
      <div @click="toNetworkElement" class="title display-flex align-items-center gap-4px">
        <span class="title-ip">{{networkElementPrefix}} {{networkElement.ip}}</span>
      </div>
      <div v-if="!noMinimap&&neIsETH&&!neIsNotInstalled" class="device-info__minimap" @click="toNetworkElement">
        <div class="device-info__ports--bad" :style="portsLine.bad"></div>
        <div class="device-info__ports--busy" :style="portsLine.busy"></div>
      </div>
      <slot name="link">
        <button-sq v-if="showLink" @click="toNetworkElement" class="margin--10px">
          <span class="ic-24 ic-right-link main-lilac"></span>
        </button-sq>
      </slot>
    </header>
    <div v-if="!hideEntrances" class="device-info__main" @click="toNetworkElement">
      <div class="device-info__entrances">
        <i class="ic-16 ic-entrance"></i>
        <span class="device-info__entrance-dot"> • </span>
        <template v-if="networkElementEntrances.length">
          <div v-for="(entrance, index) of networkElementEntrances" class="device-info__entrance">
            <span>{{entrance.number}}</span>
            <span>{{(index + 1 < networkElementEntrances.length)?',':''}}</span>
          </div>
        </template>
        <div v-else>Нет данных</div>
      </div>
    </div>
    <div v-if="showNetworkElementAdminStatus" class="ne-admin-status">{{networkElementAdminStatus}}</div>
    
    <footer class="device-info__params" @click="toNetworkElement">
      <div class="display-flex gap-10px align-items-center">
        <div class="font--11-600">{{networkElementLabel}}</div>
        <span v-if="isModelToUtil_r54" class="fa fa-trash tone-500 font-size-11px margin-bottom-2px"></span>
      </div>
      <info-subtitle v-if="sysName" :text="sysName"/>
      
      <div v-if="sysUpTime" class="width-100-100 display-flex align-items-center justify-content-end gap-4px">
        <div class="font--13-500 tone-500">sysUpTime:</div>
        <div class="font--13-500">{{sysUpTime}}</div>
        <button-sq @click.stop="updateCmtsDeviceInfo" class="width-20px min-width-20px height-20px">
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
      deviceInfo:false,
      networkElement:false,
    },
    response:{
      ping:{
        code:''
      },
      dscv:null,
      ports_lite:null,
      sessions:[],
      networkElementDeviceInfo:null,
      deviceInfo:null,
      networkElement:null,
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
    loadingSystem(){return this.loading.deviceInfo||this.loading.networkElementDeviceInfo||this.loading.networkElement},
    sysName(){return this.response.deviceInfo?.SysName||this.response.networkElementDeviceInfo?.sys_name||''},
    sysUpTime(){return this.response.deviceInfo?.SysUptime||''},
    isOnline(){
      if(this.loading.ping){return};
      return {200:true,400:false}[this.response.ping.code];
    },
    status(){
      if(this.loading.ping||typeof this.isOnline!=='boolean'){return 'loading'};
      return this.isOnline?'on':'off';
    },
    neIsETH(){return testByName.neIsETH(this.networkElement.name)},
    neIsNotInstalled(){return testByName.neIsNotInstalled(this.networkElement.ne_status)},
    networkElementPrefix(){return getNetworkElementPrefix(this.networkElement.name)},
    portsLine(){
      if(!this.response.ports_lite){return {}};
      const {total,busy,bad}=this.response.ports_lite;
      if(!total){return {}};
      return {
        busy:`width:${Math.round((busy/total)*100)}%;`,
        bad:`width:${Math.round((bad/total)*100)}%;`,
      };
    },
    networkElementEntrances(){return (this.entrances||[]).filter(({device_list})=>device_list.includes(this.networkElement.name))},
    modelText(){
      const {vendor,model,system_object_id,}=this.networkElement;
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
    sessions(){//only ports with account
      return this.response.sessions.sort((a,b)=>a.number-b.number).filter(p=>p.account);
    },
    sessionsOk(){
      return this.sessions.filter(s=>s?.session?.active).length;
    },
    sessionsBad(){
      return this.sessions.filter(s=>!s?.session?.active).length;
    },
    isValidIcmpAttrs(){
      const networkElement=this.response.networkElement||this.networkElement;
      const {ip,region:{mr_id}}=networkElement;
      return mr_id&&ip
    },
    isValidSnmpAttrs(){
      const networkElement=this.response.networkElement||this.networkElement;
      const {ip,region:{mr_id},snmp:{version,community}}=networkElement;
      return mr_id&&ip&&version&&community
    }
  },
  async created() {
    if(this.neIsETH&&!this.neIsNotInstalled){
      this.getPortsLite();
    };
    if(this.isValidIcmpAttrs){
      this.getNetworkElementDeviceInfo();
      await this.ping();
      if(!this.isValidSnmpAttrs){
        await this.getNetworkElement();
      };
      if(this.isOnline&&this.autoSysInfo){
        this.updateCmtsDeviceInfo();
      }
    };
  },
  methods: {
    updateCmtsDeviceInfo(){
      this.getCmtsDeviceInfo(true);
    },
    async getNetworkElement(){
      const {name}=this.networkElement;
      this.loading.networkElement=true;
      const cache=this.$cache.getItem(`device/${name}`);
      if(cache){
        this.response.networkElement=cache;
      }else{
        try{
          const response=await httpGet(buildUrl('search_ma',{pattern:name,component:'device-info'},'/call/v1/search/'));
          if(response.data){
            this.$cache.setItem(`device/${name}`,response.data);
            this.response.networkElement=response.data;
          };
        }catch(error){
          console.warn('search_ma:device.error',error);
        }
      };
      this.loading.networkElement=false;
    },
    async getCmtsDeviceInfo(update=false){
      const networkElement=this.response.networkElement||this.networkElement;
      const {ip,region:{mr_id},snmp:{version,community},name}=networkElement;
      if(!ip||!mr_id||!version||!community){return};

      const cache=this.$cache.getItem(`cmts_info_2/${name}`);
      if(cache&&!update){
        this.response.deviceInfo=cache;
        return
      };

      this.loading.deviceInfo=true;
      const response=await httpGet(buildUrl('cmts_info',objectToQuery({
        ip,name,MR_ID:mr_id,IP_ADDRESS:ip,SNMP_VERSION:version,SNMP_COMMUNITY:community,
        VENDOR:'HUAWEI', SYSTEM_OBJECT_ID:'.1.3.6.1.4.1.2011.2.249',ACT:'info',
      }),'/call/hdm/')).catch(console.warn);
      if(Array.isArray(response?.data)){
        this.response.deviceInfo=response.data.reduce((data,row)=>{
          const [key,[value]]=Object.entries(row)[0];
          return Object.assign(data,{[key]:value});
        },{});
        this.$cache.setItem(`cmts_info_2/${name}`,this.response.deviceInfo,5);
      };
      this.loading.deviceInfo=false;
    },
    async getNetworkElementDeviceInfo(update=false){
      const {name}=this.networkElement;
      const cache=this.$cache.getItem(`get_dismantled_devices:installed/${name}`);
      if(cache&&!update){
        this.response.networkElementDeviceInfo=cache;
        return
      };

      this.loading.networkElementDeviceInfo=true;
      const response=await httpGet(buildUrl('get_dismantled_devices',{device_name:name},'/call/v1/device/')).catch(console.warn);
      if(Array.isArray(response)){
        this.response.networkElementDeviceInfo=response.find(device=>device.status_device=='INSTALLED_DEVICE');
        this.$cache.setItem(`get_dismantled_devices:installed/${name}`,this.response.networkElementDeviceInfo);
        this.$cache.setItem(`get_dismantled_devices/${name}`,response);
      };
      this.loading.networkElementDeviceInfo=false;
    },
    async updatePing(){//public
      await this.ping();
      if(this.isOnline){
        this.updateCmtsDeviceInfo();
      }
    },
    async ping(){
      const {ip,region:{mr_id}}=this.networkElement;
      if(!ip||!mr_id){return};
      this.loading.ping=true;
      try{
        const response=await httpPost(`/call/hdm/device_ping`,{ip,mr_id,device:{MR_ID:mr_id,IP_ADDRESS:ip,SYSTEM_OBJECT_ID:null,VENDOR:null}}).catch(console.warn);
        this.response.ping=response;
      }catch(error){
        console.warn('device_ping.error',error);
      };
      this.loading.ping=false;
    },
    async get_device_session(){//public
      if(!this.neIsETH){return};
      if(!this.showSessions){return};
      if(!this.xRad_region_id){return};
      if(this.loading.sessions){return};
      this.response.sessions=[];
      this.loading.sessions=true;
      try{
        const query=objectToQuery({name:this.networkElement.name,serverid:78});
        const response=await httpGet(buildUrl('device_sessions',query,'/call/v1/device/')).catch(console.warn);
        if(Array.isArray(response)){
          this.response.sessions=response;
        };
      }catch(error){
        console.warn('device_sessions.error',error);
      };
      this.loading.sessions=false;
    },
    async discovery(){//public
      if(!this.networkElement.ip){return};
      if(this.neIsNotInstalled){return};//СЭ не введен в эксплуатацию
      const networkElement=this.response.networkElement||this.networkElement;
      const {name,ip,region:{mr_id},system_object_id,vendor,snmp:{version,community}}=networkElement;
      if(!version||!community){return};//если networkElement получен НЕ из массива по сайту(недостаточно данных)
      this.loading.dscv=true;
      try{
        const response=await httpPost(buildUrl('dev_discovery',objectToQuery({ip,name}),'/call/hdm/'),{
          ip,mr_id,
          device:{
            MR_ID:mr_id,DEVICE_NAME:name,IP_ADDRESS:ip,
            SYSTEM_OBJECT_ID:system_object_id||'',VENDOR:vendor||'',
            SNMP_VERSION:version,SNMP_COMMUNITY:community,
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
      this.loading.dscv=false;
    },
    async getPortsLite(){
      const {name}=this.networkElement;
      this.loading.ports_lite=true;
      try{
        const response=await httpGet(buildUrl('device_port_list_lite',{device:name,summary:'user'}));
        if(response?.type!=='error'){
          this.response.ports_lite=response;
        };
      }catch(error){
        console.warn('device_port_list_lite.error',error);
      };
      this.loading.ports_lite=false;
    },
    toNetworkElement(){
      if(this.disabled){return};
      if(this.rack?.name){
        this.$router.push({
          name:'network-element-in-rack',
          params:{
            deviceProp:this.networkElement,
            rackProp:this.rack,
            device_id:this.networkElement.name,
            rack_id:this.rack.name,
          },
        });
      }else{
        const prefix=getNetworkElementPrefix(this.networkElement.name);
        if(prefix==='CMTS'){//CMTS_16KR_03383_1 site:9135155036813484532
          this.$router.push({
            name: "ds_device",
            params: { name: this.networkElement.name},
          });
        }else{
          this.$router.push({//direct route for support unmount ETH devices
            name:"network-element",
            params:{
              device_id:this.networkElement.name,
              deviceProp:this.networkElement,
            },
          });
        }
      };
    },
  },
});

//fix block reboot
Vue.component("PortUserActions",{
  template:`<div name="PortUserActions" class="display-contents">
    <title-main text="Действия" :opened="open" @block-click="open=!open" textSize="medium"/>
    <template v-if="open">
      <component v-for="({props,listeners},key) of actions" :key="key" v-bind="props" v-on="listeners"/>
    </template>
  </div>`,
  props:{
    port:{type:Object,required:true,default:null},
    networkElement:{type:Object,required:true,default:null},
    disabled:{type:Boolean,default:false},//loadingSome
    status:{type:Object,default:null},
  },
  data:()=>({
    open:true,
    loads:{
      PortActionReboot:false,
      PortActionAbonBind:false,
      PortActionCableTest:false,
      PortLogs:false,
      PortActionIptvDiag:false,
      PortActionMac:false,
      PortActionIpMacPortBind:false,
    }
  }),
  watch:{
    'loadingSome'(loadingSome){
      this.$emit("loading",loadingSome);
    }
  },
  computed:{
    blocks(){
      const {is_trunk,is_link,state}=this.port;
      const isTechPort=is_trunk||is_link;
      const isTechPortLinkUp=isTechPort&&(this.status?.IF_OPER_STATUS||!this.status?.IF_ADMIN_STATUS);
      const isBad=state==='bad';
      return {
        PortActionReboot:isTechPortLinkUp||this.disabled||isBad,
        PortActionAbonBind:false,
        PortActionCableTest:isTechPortLinkUp||this.disabled,
        PortLogs:false,
        PortActionIptvDiag:false,
        PortActionMac:this.disabled,
        PortActionIpMacPortBind:isTechPort||this.disabled,
      }
    },
    loadingSome(){return Object.values(this.loads).some(l=>l)},
    actions(){
      const {port,networkElement}=this;
      return Object.keys(this.loads).map(name=>{
        return {
          props:{
            is:name,
            networkElement,
            port,
            disabled:this.disabled||this.loadingSome||this.blocks[name]||false,
          },
          listeners:{
            loading:(event)=>{
              this.eventLoading(name,event)
            }
          }
        }
      })
    }
  },
  methods:{
    eventLoading(action,event){
      this.$set(this.loads,action,event);
    },
  },
});

//disable edit
Vue.component("SiteNodeDetails", {
  template:`<CardBlock name="SiteNodeDetails">
    <title-main text="Инфо по площадке*" @open="show=!show">
      <button-sq :icon="loading?'loading rotating':'mark-circle'" @click="help.show=!help.show"/>
      <!--<button-sq v-if="show&&siteNode" :icon="$refs.SiteNodeDetailsEditModal?.loadingSome?'loading rotating':'edit'" @click="$refs.SiteNodeDetailsEditModal.open()" :disabled="loading||$refs.SiteNodeDetailsEditModal?.loadingSome"/>-->
    </title-main>
    <info-text-icon v-if="help.show" icon="info" :text="help.text"/>
    <SiteNodeDetailsEditModal v-if="siteNode" ref="SiteNodeDetailsEditModal" v-bind="modalProps" @onNodeSaveOk="get_nioss_object('node',siteNode?.node_id,'update')" @onSiteSaveOk="get_nioss_object('site',siteNode?.id,'update')"/>
    <template v-if="show&&siteNode">
      <template v-if="siteNode.lessor">
        <info-text-sec :text="siteNode.lessor?.name" class="margin-bottom-4px"/>
        <account-call v-if="siteNode.lessor?.phone" :phone="siteNode.lessor.phone" title="Контактный номер телефона" :descr="[siteNode.lessor.person,siteNode.lessor.position]" class="margin-bottom-4px"/>
        <account-call v-if="siteNode.lessor?.phone2" :phone="siteNode.lessor.phone2" title="Контактный номер телефона по вопросам доступа" class="margin-bottom-4px"/>
        <account-call v-if="siteNode.lessor?.phone3" :phone="siteNode.lessor.phone3" title="Телефонные номера аварийных служб" class="margin-bottom-4px"/>
      </template>
      
      <devider-line/>
      <info-text-sec :title="address_descr_title" :text="address_descr"/>
      
      <devider-line/>
      <info-text-sec :title="site_descr_title" :text="site_descr"/>
      
      <devider-line/>
      <info-text-sec :title="node_descr_title" :text="node_descr"/>
      
      <template v-if="address_id">
        <devider-line/>
        <UrlLink :url="urlToInventory"/>
      </template>
    </template>
  </CardBlock>`,
  props:{
    siteNode:{type:Object},
  },
  data:()=>({
    show:true,
    help:{
      text:`Информация об арендодателе площадей под размещение оборудования ПАО МТС может быть устаревшей либо вовсе не быть информацией по доступу. 
      Для корректировки данной информации нужно обратиться к ФГТСЖ. Подробная информация по доступу в помещения подъезда находится на странице Подъезд`,
      show:false,
    },
    resps:{//8100749217013993313 - получены все доступные атрибуты
      node:null,
      site:null,
      address:null,
    },
    loads:{
      node:false,
      site:false,
      address:null,
    },
  }),
  created(){
    this.get_nioss_object('address',this.siteNode?.address_id);
    this.get_nioss_object('site',this.siteNode?.id);
    this.get_nioss_object('node',this.siteNode?.node_id||this.siteNode?.uzel_id);
  },
  watch:{
    'siteNode'(siteNode){
      if(!siteNode){return};
      if(!this.resps.site&&!this.loads.site){
        this.get_nioss_object('site',this.siteNode?.id);
      }
      if(!this.resps.node&&!this.loads.node){
        this.get_nioss_object('node',this.siteNode?.node_id||this.siteNode?.uzel_id);
      }
    },
    'address_id'(address_id){
      if(address_id&&!this.resps.address&&!this.loads.address){
        this.get_nioss_object('address',address_id);
      }
    }
  },
  computed:{
    loading(){return Object.values(this.loads).some(l=>l)},
    address_descr(){return [this.resps.address?.description,this.siteNode?.details].filter(v=>v).join('\n')||'—'},
    address_descr_title(){return `Примечание к адресу ${[this.resps.address?.BuildingType||this.resps.address?.BldType||'',this.resps.address?.resource_business_name||''].filter(v=>v).join(' ')}`},
    site_descr(){return (this.resps.site?this.resps.site?.description:this.siteNode?.site_descr)||'—'},
    site_descr_title(){return `Примечание к площадке ${this.siteNode?.name||''}`},
    node_descr(){return (this.resps.node?this.resps.node?.description:this.siteNode?.node_descr)||'—'},
    //node_descr_title(){return `Примечание к УОС ${this.siteNode?.type||''}`},
    node_descr_title(){return `Примечание к УОС ${this.siteNode?.node||''}`},
    address_id(){return this.resps.site?.AddressPA?.NCObjectKey||this.siteNode?.address_id||''},
    site_name(){return this.resps.site?.SiteName||this.siteNode?.name||''},
    urlToInventory(){
      return {
        url:`https://inventory.ural.mts.ru/tb/address_view.php?id_address=${this.address_id}`,
        title:`Инвентори площадки ${this.site_name}`,
        description:this.isApp?`*переход из приложения пока может не работать\n(можно скопировать)`:''
      }
    },
    ...mapGetters({
      isApp:'app/isApp',
    }),
    modalProps(){
      const {id:site_id,node_id}=this.siteNode;
      const {site,node}=this.resps;
      return {
        site,site_id,
        node,node_id,
      }
    },
  },
  methods:{
    async get_nioss_object(object='unknown',object_id='',update=false){
      if(!object_id){return};
      if(!update){
        const cache=this.$cache.getItem(`get_nioss_object/${object_id}`);
        if(cache){
          this.resps[object]=cache;
          return;
        };
      }
      this.loads[object]=true;
      const response=await this.get_nioss_object_and_save({object_id,object});
      this.resps[object]=response||null;
      this.loads[object]=false;
    },
    async get_nioss_object_and_save({object_id,object}){
      try{
        const response=await httpGet(buildUrl("get_nioss_object",{object_id,object},"/call/nioss/"),true);
        if(response?.parent){this.$cache.setItem(`get_nioss_object/${object_id}`,response)};
        return response;
      }catch(error){
        console.warn("get_nioss_object.error",{object_id,object},error);
      }
      return null;
    },
  }
});

//подсветка выбора, fix computed titles
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
    titleText2(){return `${this.selectedCount||'0'} из ${this.totalCount||'0'}`},
    titleText2Class(){return `tone-500 ${(this.selectedCount!=this.totalCount)&&'bg-main-lilac-light border-radius-4px padding-left-right-4px'}`},
    selectedTest(){return `выбрано ${this.selectedCount||'0'} из ${this.totalCount||'0'} устройств`},
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
Vue.component('SiteNetworkElements3',{
  template:`<CardBlock name="SiteNetworkElements3" class="display-flex flex-direction-column gap-8px">
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
Vue.component('SiteNetworkElementsPlanned3',{
  template:`<CardBlock name="SiteNetworkElementsPlanned3">
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
    <SelectedNetworkElementPlannedModal2 v-if="!notSelectableTargetNetworkElements&&selected_ne_id" v-bind="{target_ne_id:selected_ne_id,source_ne_id,task_id,next_stage_id,serverid}" ref="SelectedNetworkElementPlannedModal2"/>
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
    next_stage_id(){return 1||Array.isArray(this.stages)?this.stages.length:-1},
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
      if(!this.$refs.SelectedNetworkElementPlannedModal2){return};
      this.$refs.SelectedNetworkElementPlannedModal2.open();
    },
  },
});






















