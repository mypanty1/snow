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
//document.head.appendChild(Object.assign(document.createElement('script'),{src:'https://mypanty1.github.io/snow/fix_session_1365.js',type:'text/javascript'}));

//add speed
document.head.appendChild(Object.assign(document.createElement('script'),{src:'https://mypanty1.github.io/snow/port-info-v1_add_speed.js',type:'text/javascript'}));
//disable initial port status
document.head.appendChild(Object.assign(document.createElement('script'),{src:'https://mypanty1.github.io/snow/free-ports-list_disable_initial.js',type:'text/javascript'}));

//add speed
Vue.component('port-info-v1',{
  template:`<link-block :icon="icon" :text="ifName" :textSub="textSub" textSubClass="font--13-500 tone-500" @click="toPort" actionIcon="right-link" type="medium" class="padding-left-0">
    <button-sq slot="prefix"" @click="getPortStatus">
      <div class="display-flex flex-direction-column align-items-center justify-content-space-between gap-2px">
        <div class="font--10-400 display-flex gap-2px tone-500 min-height-13px">{{ifSpeedText}}</div>
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
    ifSpeedText(){return {10:"10M",100:"100M",1000:"1G",10000:"10G"}[this.status?.high_speed]||''},
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

//fix port
Vue.component('FavCard',{
  template:`<WhiteBoxRoundedShadow name="FavCard" v-if="fav" class="display-flex flex-direction-column gap-4px">
    <div class="font--15-600">{{title}}</div>
    <link-block :text="name" @block-click="click" textClass="font--13-500" actionIcon="right-link" type="medium" class="height-24px padding-left-0"/>
    <div class="bg-main-f2f3f7 border-radius-4px display-flex align-items-start justify-content-space-between padding-4px">
      <info-text-sec :text="descr" :rowsMax="expandDescr?0:1" class="padding-unset"/>
      <button-sq @click="expandDescr=!expandDescr" class="size-20px min-width-20px">
        <IcIcon :name="expandDescr?'fa fa-chevron-up':'fa fa-chevron-down'" color="#5642BD"/>
      </button-sq>
    </div>
    <div class="display-flex align-items-center justify-content-space-between">
      <span class="font--12-400 tone-500">Дата добавления: {{create_date_local}}</span>
      <button-sq @click="$refs.FavEditOrRemoveModal?.open()" :disabled="disabled" class="size-20px min-width-20px">
        <IcIcon name="Dots3" :color="!disabled?'#5642BD':'#969FA8'"/>
      </button-sq>
    </div>
    <FavEditOrRemoveModal ref="FavEditOrRemoveModal" v-bind="{fav_id}"/>
  </WhiteBoxRoundedShadow>`,
  props:{
    fav_id:{type:[String,Number],required:true},
    disabled:{type:Boolean,default:false}
  },
  data:()=>({
    expandDescr:false,
  }),
  computed:{
    ...mapGetters({
      getResp:'favs/getResp',
    }),
    fav(){return this.getResp('favs',this.fav_id)},
    create_date(){return this.fav?.create_date||''},//"2023-05-23T12:26:26.000+03:00",
    create_date_local(){return new Date(Date.parse(this.create_date)).toLocaleDateString()},
    //clear_date(){return this.fav?.clear_date||''},//"2023-06-22T12:26:26.000+03:00",
    //delete_date(){return this.fav?.delete_date||''},//null,
    title(){return this.fav?.object_type||''},//"ne",
    name(){return this.fav?.object_name||''},//"ETH_54KR_00340_14",
    descr(){return this.fav?.description||''},//"network-element-ETH_54KR_00340_14",
    object_id(){return this.fav?.object_id||''},//"9157470089313556000",
    path(){return this.fav?.url||''},//"/network-element-ETH_54KR_00340_14",
    //first_click_date(){return this.fav?.first_click_date||''},//"2023-05-23T14:45:11.000+03:00",
    //last_click_date(){return this.fav?.last_click_date||''},//"2023-05-23T14:45:11.000+03:00",
    //click_count(){return this.fav?.click_count||0},//1
  },
  methods:{
    ...mapActions({
      doFavClickLog:'favs/doFavClickLog',
    }),
    click(){
      const {fav_id,path,object_id}=this;
      this.doFavClickLog({fav_id})
      if(path){
        this.$router.push(/^PORT-/i.test(object_id)?`/${encodeURIComponent(object_id)}`:path);
      }else{
        this.$router.push({name:'search',params:{text:object_id}})
      };
    },
  },
});

//add btn border
Vue.component('FavEditOrRemoveModal',{
  template:`<modal-container-custom name="FavEditOrRemoveModal" ref="modal" :footer="false" @close="onClose" :wrapperStyle="{'min-height':'auto','margin-top':'4px'}">
    <div class="padding-left-right-16px">
      <div v-if="editDescrMode" class="font--15-600 text-align-center">{{titleText}}</div>
      <div class="display-flex flex-direction-column gap-16px margin-top-16px">

        <template v-if="!editDescrMode">
          <button-main :label="btnModeLabel" @click="editDescrMode=!editDescrMode" :disabled="loadingDeleteFav" size="full" class="justify-content-start">
            <IcIcon slot="icon" name="Pen" color="#BBC1C7"/>
          </button-main>
          <button-main label="Удалить зпаись" @click="deleteThisFav" :disabled="loadingDeleteFav" size="full" class="justify-content-start">
            <IcIcon slot="icon" name="Trashcan" color="#F95721"/>
          </button-main>
        </template>
        <div v-else class="display-flex flex-direction-column gap-4px">
          <IcTextArea :ictextareaid="fav_id" rows="14" :label="textLabel" v-model="newDescr" :disabled="loadingChangeDescr" :error="descrIsOver512"/>
          <div class="display-flex align-items-center justify-content-space-between margin-top--4px gap-4px">
            <div class="display-flex align-items-center gap-4px">
              <button-sq @click="clearDescr" class="size-20px min-width-20px" title="очистить">
                <IcIcon name="contract-off" color="#5642BD" size="16"/>
              </button-sq>
              <button-sq @click="copyDescr" class="size-20px min-width-20px" title="копировать">
                <IcIcon name="copy" color="#5642BD" size="16"/>
              </button-sq>
            </div>
            <div v-if="descrIsOver512" class="display-flex align-items-center gap-4px">
              <input-error text="Не более 512 символов" class="padding-unset"/>
              <button-sq @click="sliceDescr512" :disabled="sliceDescr512Loading" class="size-20px min-width-20px border-solid-1px-c8c7c7 border-radius-4px" title="обрезать до 512">
                <IcIcon :name="sliceDescr512Loading?'loading rotating':'left-link'" color="#5642BD" size="16"/>
              </button-sq>
            </div>
          </div>
          <button-main :label="btnChangeLabel" @click="saveNewDescr" :disabled="sliceDescr512Loading||loadingChangeDescr||newDescr==descr||descrIsOver512" buttonStyle="contained" size="full"/>
        </div>

      </div>
      <div class="margin-top-16px display-flex justify-content-space-around">
        <button-main label="Закрыть" @click="close" buttonStyle="outlined" size="medium"/>
      </div>
    </div>
  </modal-container-custom>`,
  props:{
    fav_id:{type:[Number,String],required:true}
  },
  data:()=>({
    textLabel:'Ваш комментарий',
    editDescrMode:false,
    newDescr:'',
    sliceDescr512Loading:false,
    sliceDescr512Timer:null,
  }),
  watch:{
    'sliceDescr512Loading'(loading){
      if(loading){
        this.textLabel='Ваш комментарий обрезается...';
      }else{
        this.textLabel='Ваш комментарий обрезан';
        this.sliceDescr512Timer=setTimeout(()=>{this.textLabel='Ваш комментарий'},2222);
      }
    }
  },
  computed:{
    ...mapGetters({
      getLoad:'favs/getLoad',
      getResp:'favs/getResp',
    }),
    fav(){return this.getResp('favs',this.fav_id)},
    descr(){return this.fav?.description||''},
    titleText(){return this.descr?'Редактирование комментария':'Добавление комментария'},
    btnModeLabel(){return this.descr?'Редактировать комментарий':'Добавить комментарий'},
    btnChangeLabel(){return !this.descr?'Добавить комментарий':'Сохранить изменения'},
    loadingChangeDescr(){return this.getLoad('change',this.fav_id)},
    loadingDeleteFav(){return this.getLoad('delete',this.fav_id)},
    descrIsOver512(){return this.newDescr.length>512},
  },
  methods:{
    open(){//public
      this.$refs.modal.open();
      this.newDescr=this.newDescr||this.descr;
    },
    close(){//public
      this.$refs.modal.close();
    },
    onClose(){
      this.editDescrMode=false;
      this.newDescr='';
    },
    ...mapActions({
      getFavs:'favs/getFavs',
      doChangeDescr:'favs/doChangeDescr',
      getFav:'favs/getFav',
      doDeleteFav:'favs/doDeleteFav',
    }),
    async sliceDescr512(){
      clearTimeout(this.sliceDescr512Timer);
      this.sliceDescr512Loading=true;
      this.$el.querySelector(`[ictextareaid="${this.fav_id}"] textarea`)?.scrollTo({top:1111});
      for(const i of this.newDescr) {
        if(this.newDescr.length<=512){break};
        this.newDescr=this.newDescr.slice(0,-1);
        await new Promise(resolve=>setTimeout(resolve,1));
      };
      this.sliceDescr512Loading=false;
    },
    clearDescr(){
      this.newDescr='';
    },
    copyDescr(){
      copyToBuffer(this.newDescr);
    },
    async deleteThisFav(){
      const {fav_id}=this;
      await this.doDeleteFav({fav_id});
      if(this.getResp('delete',fav_id)=='OK'){
        this.getFavs();
        this.close();
      };
    },
    async saveNewDescr(){
      const {fav_id,newDescr}=this;
      await this.doChangeDescr({fav_id,description:newDescr});
      if(this.getResp('change',fav_id)=='OK'){
        this.getFav({fav_id});
        this.close();
      };
    },
  },
});

//add opt.28
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
    start(){return this.session?.start||''},
    startLocal(){return this.start;return (!this.start||!Date.prototype.toDateTimeString)?'':new Date(Date.parse(`${this.start} GMT+0300`)).toDateTimeString()},
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
    next_stage_id(){return 1;/*Array.isArray(this.stages)?this.stages.length:-1*/},//RKD_test_path
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






















