//fix cpe undefined
Vue.component('AbonPortBindModal',{
  template:`<div name="AbonPortBindModal">
    <modal-container-custom ref="modal" :disabled="macsLoading||setBindLoading" header :footer="false" @open="onOpen" @close="onClose" :wrapperStyle="{'min-height':'auto','margin-top':'4px'}">
      <div class="padding-left-right-16px display-flex flex-direction-column gap-16px">
        <div class="display-flex flex-direction-column">
          <div class="font--15-600 text-align-center">Привязать ЛС</div>
          <div class="font--13-500 tone-500 text-align-center">{{subtitle}}</div>
        </div>
        
        <div class="display-flex flex-direction-column gap-8px">
          <AbonPortBindSearchAbon ref="AbonPortBindSearchAbon" @onAccountFind="account=$event" @onVgSelect="vg=$event" @onMrId="mrId=$event"/>
          
          <template v-if="vg&&mac">
            <title-main :text="cpesLoading?'поиск CPE...':cpeTitle" textSize="medium" :opened="openBindCPE" @block-click="openBindCPE=!openBindCPE" class="padding-unset">
              <button-sq @click.stop="getCpes" :icon="cpesLoading?'loading rotating':'refresh'"/>
            </title-main>
            <template v-if="openBindCPE">
              <service-activation-cpe ref="service_activation_cpe" v-bind="{account,service:vg,cpes,macs,port:{device:networkElement}}"/>
              <button-main :disabled="cpesLoading" @click="$refs.service_activation_cpe.changeEquipment()" label="Привязать CPE" buttonStyle="contained" size="full"/>
            </template>
          </template>

          <template v-if="vg?.type_of_bind">
            <AbonPortBindForm v-bind="{networkElement,port,account,vg,macs,macsLoading,disabled:macsLoading||setBindLoading||vgNotActive131,loading:macsLoading||setBindLoading}" @loading="setBindLoading=$event" @result="setBindResult=$event" @mac="mac=$event" @callParent="doCall"/>
            <AbonPortRefree v-bind="{setBindResult,networkElement,port,account,vg,disabled:macsLoading||setBindLoading,loading:macsLoading||setBindLoading}" @loading="setBindLoading=$event"/>
          </template>
          <template v-else-if="vg">
            <message-el text="Привязка этой УЗ не предусмотрена" type="info" box/>
          </template>
        </div>
        <div class="display-flex justify-content-space-around">
          <button-main label="Закрыть" @click="close" :disabled="macsLoading||setBindLoading" buttonStyle="outlined" size="medium"/>
        </div>
      </div>
    </modal-container-custom>
  </div>`,
  props:{
    port:{type:Object,required:true},
    networkElement:{type:Object,required:true},
  },
  data:()=>({
    account:'',
    vg:null,
    mrId:0,
    macsLoading:false,
    macs:[],
    macsErrorText:'',
    setBindLoading:false,
    setBindResult:null,
    mac:'',
    cpesLoading:false,
    cpes:[],
    openBindCPE:false,
  }),
  watch:{
    'typeOfBind'(typeOfBind){
      if(typeOfBind){
        this.getMacsFirst()
      };
    },
    'mrId'(mrId){
      if(mrId){
        this.getCpes()
      }
    },
    'mac'(mac){
      if(mac){
        this.getCpes()
      }
    },
    'setBindResult'(setBindResult){
      if(setBindResult?.code==200||setBindResult?.InfoMessage||setBindResult?.Data){
        if(this.$refs.service_activation_cpe){this.$refs.service_activation_cpe.cpeRegistre()};
      }
    }
  },
  computed:{
    subtitle(){return `${this.networkElement?.ip} порт ${this.port?.snmp_name||this.port?.number}`},
    typeOfBind(){return this.vg?.type_of_bind},
    vgNotActive131(){
      const {serverid,available_for_activation}=this.vg||{};
      return serverid==131&&available_for_activation;
    },
    hasCpe(){return Boolean(this.cpes?.[0])},
    cpeTitle(){return `добавить CPE ${this.cpes?.[0]?.model||''}`},
  },
  methods:{
    open(){//public
      this.$refs.modal.open();
    },
    close(){//public
      this.$refs.modal.close();
    },
    onOpen(){
      this.getMacsFirst();
    },
    onClose(){
      this.clear();
    },
    clear(){
      this.macs=[];
      this.macsLoading=false;
      this.macsErrorText='';
      this.$refs.AbonPortBindSearchAbon?.clear();
      this.account='';
      this.vg=null;
      this.mrId=0;
      this.setBindLoading=false;
      this.setBindResult=null;
      this.mac='';
    },
    doCall(event){
      if(!Array.isArray(event)){return}
      const [methodName,...attrs]=event;
      if(typeof this?.[methodName]=='function'){
        this[methodName](...attrs);
      };
    },
    getMacsFirst(){
      //if(![2,5,7,9,10].includes(parseInt(this.typeOfBind))){return};
      if(this.macs.length){return};
      this.getMacs();
    },
    async getMacs(){
      this.macsLoading=!0;
      this.macs=[];
      this.macsErrorText='';
      try{
        const response=await httpGet(buildUrl('port_mac_show',{type:'array',...new DNM.DevicePortParams(this.networkElement,this.port)},"/call/hdm/"));
        if(Array.isArray(response?.text)){
          this.macs=response.text/*.reduce((macs,row)=>{
            const mac=((row.match(/\S{12,17}/gi)||[''])[0].replaceAll(/[^0-9A-Fa-fx]/gi,'').match(/[0-9A-Fa-fx]{12}/gi)||[''])[0];
            if(mac){macs.push(mac)};
            return macs;
          },[]);*/
        };
      }catch(error){
        console.warn("port_mac_show.error",error);
      }
      this.macsLoading=!1;
    },
    async getCpes(){
      const {macs,mac,mrId}=this;
      const _mac=mac||macs[0];
      if(!_mac||!mrId){return};
      this.cpesLoading=!0;
      this.cpes=[];
      const cacheKey=`routersByMac-${mrId}-${_mac}`;
      try{
        const response=this.$cache.getItem(cacheKey)||await httpGet(buildUrl('cpe_registre',{mac:_mac,mr_id:mrId,mr:mrId,mrId},'/call/axiros/')/*,{mac:_mac,mr_id:mrId,mr:mrId,mrId}*/);
        this.$cache.setItem(cacheKey,this.cpes=(Array.isArray(response)?response:[]).map(cpe=>({...cpe,mac:_mac,mr_id:mrId,mr:mrId,mrId})));
      }catch(error){
        console.warn('cpe_registre.error', error);
      };
      this.cpesLoading=!1;
    },
  },
});

//add activateIsOk
Vue.component('AbonPortBindSelectAbonInternetServiceItem',{
  template:`<div name="AbonPortBindSelectAbonInternetServiceItem">
    <radio-el v-model="selectedVg" :value="vg" :label="label" :disabled="loading"/>
    <info-text-sec v-if="state" :text="state"/>
    <div v-if="vg.tardescr" class="font--13-500 tone-500">{{vg.tardescr}}</div>
    <div v-if="vg.available_for_activation" class="display-flex align-items-center justify-content-flex-end">
      <span v-if="loading" class="ic-24 ic-loading rotating main-lilac size-32px line-height-32px text-align-center"></span>
      <span v-else-if="result" class="size-32px line-height-32px text-align-center fas fa-lg" :class="activateIsOk?'fa-check':'fa-times'" :style="{color:activateIsOk?'#20a471':'#f16b16'}"></span>
      <button-main :label="activatespd?'активировать по sms':'активировать'" v-if="vg.available_for_activation" @click="activate" :disabled="loading" buttonStyle="outlined" size="content"/>
    </div>
  </div>`,
  props:{
    agreement:{type:Object,required:true},
    vg:{type:Object,required:true},
    value:{validator:()=>true},
  },
  data:()=>({
    loading:false,
    result:null,
  }),
  watch:{
    'result'(result){
      //if(this.activateIsOk){
        this.$emit('onVgUnblock',this.vg.vgid)
      //}
    }
  },
  computed:{
    label(){
      return `${this.vg.login} • ${this.vg.vgid}`
    },
    selectedVg:{
      get(){return this.value},
      set(value){this.$emit('input',value)}
    },
    state(){
      const {statusname,accondate,accoffdate,changedtariffon}=this.vg;
      if(!statusname){return ''};
      switch(statusname){
        case 'Активна':
          return `${statusname} с  ${this.getDate(accondate)}`;
        case 'Отключена':
          if(accoffdate){
            return `${statusname}  ${this.getDate(accoffdate)}`;
          }else{
            return `Создан  ${this.getDate(changedtariffon)}`;
          };          
        default:
          return `${statusname} ${this.getDate(changedtariffon)}`;
      };
    },
    activatespd(){
      return ['108','64','234'].includes(this.vg.serverid);
    },
    activateIsOk(){return this.result?.Ret==1}
  },
  methods:{
    getDate(str=''){
      if(!str){return ''};
      const dateStr=new Date(Date.parse(str)).toLocaleDateString();
      if(dateStr=='Invalid Date'){return ''};
      return dateStr;
    },
    activate(){
      if(this.activatespd){
        this.activate_sms();
      }else{
        this.vg_unblock();
      };
    },
    activate_sms(){
      this.loading=!0;
      this.result=null;
      if(this.$store.getters['app/isApp']){
        this.$store.dispatch('app/sendToApp',`do:sendSms:direct:+79139801727=activatespd ${this.vg.vgid}`);
      }else{
        const smsText=encodeURIComponent(`activatespd ${this.vg.vgid}`);
        window.open(`sms::+79139801727?body=${smsText}`,'_blank');
      };
      this.result={Ret:1};
      this.loading=!1;
    },
    async vg_unblock(){
      this.loading=!0;
      this.result=null;
      try{
        const response=await httpPost('/call/lbsv/vg_unblock',filterKeys(this.vg,'serverid,vgid,isSession,agenttype'),true);
        this.result=response;
      }catch(error){
        console.warn('vg_unblock.error',error)
      };
      this.loading=!1;
    },
  },
});

//for pre3
Vue.component('AbonPortBindSelectAbonInternetService',{
  template:`<div name="AbonPortBindSelectAbonInternetService">
    <link-block icon="person" :text="agreement.account" :search="agreement.account" class="padding-unset"/>
    <div v-if="address" class="font--13-500 tone-500">{{address}}</div>
    <info-value label="Телефон" v-if="abonData.phone" :value="abonData.phone" type="medium" withLine class="padding-unset"/>
    <info-value label="Баланс" :value="balance" type="medium" withLine class="padding-unset"/>
    <info-value label="Последний платеж" :value="lastPayment" type="medium" withLine class="padding-unset"/>
    <devider-line/>

    <message-el v-if="!vgroups.length" text="Нет учетных записей" box type="warn"/>
    <title-main v-else text="Учетная запись для связи:" class="padding-unset"/>
    <template v-for="(vg,index) of vgroups">
      <devider-line v-if="index"/>
      <AbonPortBindSelectAbonInternetServiceItem v-bind="{agreement,vg}" :key="vg.vgid" v-model="selectedVg" @onVgUnblock="$emit('onVgUnblock',$event)"/>
    </template>
  </div>`,
  props:{
    abonData:{type:Object,required:true},
    agreement:{type:Object,required:true},
    vgroups:{type:Array,required:true,default:()=>[]},//sorted by vgid and accondate
    value:{validator:()=>true},
  },
  data:()=>({}),
  watch:{},
  computed:{
    selectedVg:{
      get(){return this.value},
      set(value){this.$emit('input',value)}
    },
    address(){
      const {address}=this.abonData;
      if(!address?.split){return};
      return address.split(',').filter(Boolean).join(',');
    },
    balance(){
      const {balance:{minus,integer,fraction}}=this.agreement;
      return `${(minus)?'-':''}${integer}.${fraction} ₽`
    },
    lastPayment(){
      const {lastsum,lastpaydate}=this.agreement;
      const lastsumText = (lastsum || lastsum == 0)?`${lastsum} ₽`:'';
      if(lastsumText&&lastpaydate){return `${lastsumText} • ${lastpaydate}`}
      return lastsumText||lastpaydate;
    },
  },
  methods:{},
});


