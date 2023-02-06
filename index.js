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
function tasksToState(state,tasks){
  for(const task of tasks){
    const {id,started_at,deadline}=task;
    const startMs=Date.parse(started_at);
    const deadlineMs=Date.parse(deadline);
    state.tasks[id]={
      ...task,
      startMs,
      deadlineMs,
      countdownRunning:false,
      countdownTimer:null,
      countdownMs:0
    };
  };
}
/*Vue.component('SelectedNetworkElementPlannedModal',{
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
    request_id:{type:String,required:true},
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
      getSiteNetworkElementPlannedById:'site/getSiteNetworkElementPlannedById',
      getSiteNetworkElementById:'site/getSiteNetworkElementById',
    }),
    networkElement(){return this.getSiteNetworkElementPlannedById(this.target_ne_id)||this.getSiteNetworkElementById(this.target_ne_id)},
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
      await this.getSiteNetworkElementsPlanned({site_id,update:true});
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
      const {target_ne_id,networkElement,site_id,request_id,source_ne_id,no_next_stage_id,serverid}=this;
      if(no_next_stage_id){
        this.errorText='Невозможно произвести замену СЭ';
        this.iconProps=this.iconPresets.warning;
        return
      };

      const sourceNetworkElement=this.getSiteNetworkElementPlannedById(source_ne_id)||this.getSiteNetworkElementById(source_ne_id);
      if(!sourceNetworkElement?.ne_name){
        this.errorText='Нет демонтируемого СЭ';
        this.iconProps=this.iconPresets.warning;
        return
      };

      //12
      this.loaderText=`Замена СЭ ${sourceNetworkElement.ip} на СЭ ${this.ip} в рамках работы ${request_id}`;
      const old_device_name=sourceNetworkElement.ne_name;
      const new_device_name=this.ne_name;
      await this.addRemedyWorkStage({request_id,old_device_name,new_device_name});
      const addRemedyWorkStageKey=atok(request_id,old_device_name,new_device_name);
      const addRemedyWorkStageResult=this.addRemedyWorkStageResultByKey(addRemedyWorkStageKey);
      if(!addRemedyWorkStageResult){
        this.errorText=`Ошибка замены СЭ ${sourceNetworkElement?.ip} на СЭ ${this.ip}`;
        this.iconProps=this.iconPresets.warning;
        return
      };
      console.log({addRemedyWorkStageKey,addRemedyWorkStageResult});
      
      this.loaderText=`Проверка замены СЭ ${sourceNetworkElement.ip} на СЭ ${this.ip}`;
      await this.getRemedyWorkStages({request_id});
      
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
          await this.clientsReconnect({request_id,serverid,old_device_name});
          if(false&&this.clientsReconnectResultByKey(atok(request_id,serverid,old_device_name))==='OK'){
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
          request_id,
          ne_site_id:site_id,//TODO: нет метода получения СЭ в статусе планируется
          source_ne_id:sourceNetworkElement.ne_id,
          target_ne_id,
          targetNetworkElementProps:networkElement,
          sourceNetworkElementProps:sourceNetworkElement,
        },
      });
    },
    ...mapActions({
      getSiteNetworkElements:'site/getSiteNetworkElements',
      getSiteNetworkElementsPlanned:'site/getSiteNetworkElementsPlanned',
      addRemedyWorkStage:'remedy/addRemedyWorkStage',
      getRemedyWorkStages:'remedy/getRemedyWorkStages',
      clientsReconnect:'xrad/clientsReconnect',
      doPing:'ping/doPing',
    }),
  },
});*/

