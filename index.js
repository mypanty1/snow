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

Vue.component('PortSfp',{
  template:`<div name="PortSfp" class="sfp-info">
    <loader-bootstrap v-if="loads.sfp" text="получение SFP"/>
    <template v-if="!loads.sfp&&sfp">
      <info-value label="model" :value="DdmInfoVendorName+' '+DdmInfoVendorPartNum" withLine/>
      <info-value label="serial" :value="DdmInfoVendorSerialNum" withLine/>
      <info-value label="length" :value="DdmInfoLinklength" v-if="DdmInfoLinklength" withLine/>
      <div class="si-params-table margin-bottom-4px">
        <div class="si-pt-type">{{DdmInfoWavelength||DdmInfoType}}</div>
        <param-el title="Rx" :value="DdmInfoRxpower" units="dBm" class="si-pt-rx bb br" :valueStyle="warns.rx" :loading="loads.sfp" :error="!isValidParams||error||sfp.error" plus/>
        <param-el title="Tx" :value="DdmInfoTxpower" units="dBm" class="si-pt-tx bb br" :valueStyle="warns.tx" :loading="loads.sfp" :error="!isValidParams||error||sfp.error" plus/>
        <param-el title="Bias" :value="DdmIndexBias" units="mA" class="si-pt-bias bb" :valueStyle="warns.bias" :loading="loads.sfp" :error="!isValidParams||error||sfp.error"/>
        <param-el title="Vcc" :value="DdmInfoVoltage" units="V" class="si-pt-vcc bb" :valueStyle="warns.vcc" :loading="loads.sfp" :error="!isValidParams||error||sfp.error" fixed/>
        <param-el title="Temp" :value="DdmInfoTemperature" units="°C" class="si-pt-temp bb" :valueStyle="warns.temp" :loading="loads.sfp" :error="!isValidParams||error||sfp.error" plus/>
      </div>
      <link-block text="История" @block-click="openHistory" actionIcon="right-link" v-if="canGetHistory"/>
      <PortSfpModal v-bind="{port,networkElement}" ref="modal_sfpHistoryModal" v-if="canGetHistory"/>
    </template>
    <message-el v-if="!loads.sfp&&error" :text="error" type="warn" class="margin-bottom-8px" box/>
  </div>`,
  props:{
    networkElement:{type:Object,default:()=>({}),required:true},
    port:{type:Object,default:()=>({}),required:true},
  },
  data:()=>({
    loads:{
      sfp:false,
    },
    sfp:null,
    error:false,
  }),
  created(){
    this.getPortSfp();
  },
  computed:{
    DdmInfoWavelength(){return this.sfp?.DdmInfoWavelength?(parseInt(this.sfp?.DdmInfoWavelength)+' nm'):''},
    DdmInfoLinklength(){return this.sfp?.DdmInfoLinklength?(parseInt(this.sfp?.DdmInfoLinklength)+' m'):''},
    DdmIndexBias(){return parseFloat(this.sfp?.DdmIndexBias||this.sfp?.DdmInfoIndexBias)},
    DdmInfoManufacturingDate(){return this.sfp?.DdmInfoManufacturingDate||''},
    DdmInfoRxpower(){return parseFloat(this.sfp?.DdmInfoRxpower)},
    DdmInfoTemperature(){return parseFloat(this.sfp?.DdmInfoTemperature)},
    DdmInfoTxpower(){return parseFloat(this.sfp?.DdmInfoTxpower)},
    DdmInfoType(){return this.sfp?.DdmInfoType||''},
    DdmInfoVendorName(){return this.sfp?.DdmInfoVendorName||''},
    DdmInfoVendorPartNum(){return this.sfp?.DdmInfoVendorPartNum||''},
    DdmInfoVendorRevNum(){return this.sfp?.DdmInfoVendorRevNum||''},
    DdmInfoVendorSerialNum(){return this.sfp?.DdmInfoVendorSerialNum||''},
    DdmInfoVoltage(){return parseFloat(this.sfp?.DdmInfoVoltage)},

    warns(){
      const warnStyle=`background-color:${PORT_SFP.bgWarn};`;
      return {
        rx:this.DdmInfoRxpower<-14||this.DdmInfoRxpower>-1?warnStyle:'',
        tx:this.DdmInfoTxpower<-2||this.DdmInfoTxpower>3?warnStyle:'',
        bias:this.DdmIndexBias<5||this.DdmIndexBias>39?warnStyle:'',
        vcc:this.DdmInfoVoltage<3.1||this.DdmInfoVoltage>3.5?warnStyle:'',
        temp:this.DdmInfoTemperature<10||this.DdmInfoTemperature>59?warnStyle:''
      };
    },

    isValidParams(){
      return this.DdmInfoVoltage
    },
    canGetHistory(){return this.port?.snmp_name&&this.networkElement?.name},
  },
  methods:{
    async getPortSfp(){
      if(!this.port?.snmp_name){return};
      if(!this.networkElement?.system_object_id){return};
      if(this.loads.sfp){return};
      this.sfp=null;
      this.error=false;
      this.loads.sfp=true;
      const {region:{mr_id:MR_ID},ip:IP_ADDRESS,system_object_id:SYSTEM_OBJECT_ID,vendor:VENDOR,snmp:{version:SNMP_VERSION,community:SNMP_COMMUNITY}}=this.networkElement;
      const {snmp_name:PORT}=this.port;
      try{
        const response=await httpGet(buildUrl('sfp_detail',{
          MR_ID,IP_ADDRESS,SYSTEM_OBJECT_ID,SNMP_COMMUNITY,VENDOR,SNMP_VERSION,ACT:'sfp_iface',PORT
        },'/call/hdm/'));
        if(response.type==='error'){
          this.error=response.text||response.message||'ошибка';
          throw new Error(response.text);
        };
        if(typeof response==="object"){
          this.sfp={};
          const params=response[Object.keys(response)[0]];
          for(const param in params){
            this.sfp[param]=Object.keys(params[param])[0];
          };
          console.log({response,sfp:this.sfp})
        }else{
          this.error='нет данных';
        };
      }catch(error){
        console.warn('sfp_detail.error',error);
      };
      this.loads.sfp=false;
    },
    openHistory(){
      if(!this.$refs.modal_sfpHistoryModal){return};
      this.$refs.modal_sfpHistoryModal.open()
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

//правка текста по ОС от ТБ
Vue.component('rack-box', {
  template: `<div :class="rackClass">
    <div class="rack-box__link" @click="toRack">
      <div :class="typeClass" style="width:32px;" v-if="rackType">{{rackType}}</div>
      <div :class="typeClass" v-if="iconRack"><i class="fas" :class="iconRack"></i></div>
      <div class="rack-box__floor"><span class="ic-20 ic-entrance-mini"></span>{{ entrance }}</div>
      <div class="rack-box__location" :class="{'rack-box--error':!rackLocation}"><span class="ic-20 ic-floor"></span>{{ rackLocation||'неизвестно'}}</div>
      <div v-if="horizontalLocation" class="rack-box__drs-number">{{horizontalLocation}}</div>
    </div>
    <title-main v-if="locationFilteredAndTrunkated||notes||description" icon="circle-1" :text="locationFilteredAndTrunkated" text1Class="font--13-500" @open="show_notes=!show_notes" :opened="show_notes" class="margin-top--8px margin-bottom--16px">
      <button-sq v-if="nioss_loading" icon="loading rotating" type="large" @click=""/>
      <button-sq v-else-if="!nioss_object" icon="refresh" type="large" @click="get_nioss_object"/>
    </title-main>
    <template v-if="show_notes">
      <info-text-sec v-if="location!==locationFilteredAndTrunkated" :text="location"/>
      <info-text-sec :text="notes"/>
      <info-text-sec :text="description"/>
      <devider-line v-if="location||notes||description"/>
    </template>
    <loader-bootstrap v-if="isLoading" text="загрузка данных"/>
    <slot v-else>
      <span class="font--13-500 tone-500 text-align-center">нет оборудования</span>
    </slot>
  </div>`,
  props:{
    rack:{type:Object,default:null,required:true},
    isLoading:{type:Boolean,default:false},
    reversed:{type:Boolean,default:false},
  },
  data(){
    return {
      nioss_loading:false,
      nioss_object:null,
      show_notes:!!(this.rack?.notes||this.rack?.description),
    }
  },
  created(){
    if(this.$route.name!=='rack'){//открыть и обновить если компонент не в rack-content
      //на одной странице может быть множество рк, многовато запросов к oss/j
      //this.show_notes=!!(this.rack?.notes||this.rack?.description);
      //this.get_nioss_object();
    };
  },
  watch:{
    'nioss_object'(nioss_object){//toggle notes по обновлению nioss_object
      this.show_notes=!!(nioss_object?.Primechanie||nioss_object?.description);
    },
    'show_notes'(show_notes){//если компонент в rack-content и пользователь все же его открыл
      if(show_notes&&!this.nioss_object&&!this.nioss_loading){this.get_nioss_object()};
    }
  },
  computed: {
    rackClass() {
      const isVandal = this.rack?.type === "Антивандальный";
      return {
        'rack-box': true,
        'rack-box--reversed': this.reversed,
        'rack-box--empty': !this.rack,
        'rack-box--solid': isVandal,
        'rack-box--dashed': !isVandal,
      }
    },
    typeClass() {
      const isVandal = this.rack?.type === "Антивандальный";
      return {
        'rack-box__type': true,
        'rack-box--solid': isVandal,
        'rack-box--dashed': !isVandal,
      }
    },
    isOptical(){//return true//FAKE для демо, все шкафы - ОРШ
      return this.rack?.ne_in_rack.filter(ops=>/(ops|odf)/i.test(ops)).length;
    },
    rackType(){
      return {
        "Антивандальный":this.isOptical?'ОРШ':'ШДУ',
        "Абонентская Распределительная Коробка":this.isOptical?'ОРК':'РК',
      }[this.rack.type]
    },
    iconRack() {
      if(!this.rack){return ''};
      if(this.rack?.ne_in_rack?.length){return "ic-20 ic-plint"};
      return '';
    },
    rackLocation(){
      return ({'Чердак':'на чердаке','Технический этаж':'на тех.этаже','Подвал':'в подвале'}[this.off_floor])||("этаж "+this.floor)||''
    },
    horizontalLocation(){
      if(!this.drs_number){return ''};
      if(this.drs_number.length<3){return 'стояк '+this.drs_number};
      return this.drs_number;//левый,средний,правый
    },
    entrance(){return this.rack?.entrance?.number||''},
    location(){return this.nioss_object?.RaspologenieShkaf||this.rack?.location||''},
    notes(){return this.nioss_object?.Primechanie||this.rack?.notes||''},
    description(){return this.nioss_object?.description||this.rack?.description||''},
    off_floor(){return this.nioss_object?.VneEtashnoeRazmechenie||this.rack?.off_floor||''},
    floor(){return this.nioss_object?.Etazh||this.rack?.floor||''},
    drs_number(){return this.nioss_object?.NomerDRS||this.rack?.drs_number||''},
    locationFilteredAndTrunkated(){
      let location=this.location.replace(`Подъезд ${this.entrance}.`,'').replace(`Этаж ${this.floor}.`,'').replace(`${this.off_floor}.`,'').trim().toLowerCase();
      return location.length>27?location.substring(0,25)+'...':location
    },
  },
  methods:{
    toRack(){
      this.$router.push({
        name:'rack',
        params:{
          rackProp:this.rack,
          rack_id:this.rack?.name,
        },
      });
    },
    async get_nioss_object(){
      this.nioss_loading=true;
      try{
        const response=await httpGet(buildUrl('get_nioss_object',{object_id:this.rack?.id,object:'rack'},'/call/nioss/'), true);
        this.nioss_object=response;
      }catch(error){
        console.warn('get_nioss_object.error',error);
      }
      this.nioss_loading=false;
    },
  },
});

//fix click
Vue.component('url-el',{
  template:`<div>
    <template v-if="urlObj.urls">
      <title-main :text="urlObj.title" :text2="urlObj?.urls?.length||'нет'" text2Class="tone-500" :iconClass="urlObj.icon +' main-lilac margin-right-8px'" :iconClassEnable="!urlObj.icon" @open="open=!open"/>
      <info-text-sec :text="urlObj.description" class="margin-bottom-8px" style="margin-top:-8px;"/>
      <template v-if="open">
        <template v-for="(url,i) of urlObj.urls">
          <devider-line v-if="i"/>
          <url-el :key="i" :url="url"/>
        </template>
      </template>
    </template>
    <template v-else>
      <link-block v-if="urlObj.title" iconClass="fas fa-link main-lilac padding-right-4px" :text="urlObj.title" textClass="font--11-600" @block-click="goTo(urlObj.url)" @click.stop="goTo(urlObj.url)" type="medium" class="padding-right-8px"/>
      <link-block v-if="urlObj.url" :text="urlObj.url.length>30?urlObj.url.slice(0,30)+'...':urlObj.url" textClass="font--11-600" textStyle="color:#0066cc;" @block-click="copy(urlObj.url)" @click.stop="copy(urlObj.url)" type="medium" actionIcon="copy" class="padding-right-8px" style="margin-top:-8px;"/>
      <info-text-sec :text="urlObj.description" class="margin-bottom-8px" style="margin-top:-8px;"/>
      <link-block v-if="urlObj.url2" :text="urlObj.url2.length>30?urlObj.url2.slice(0,30)+'...':urlObj.url2" textClass="font--11-600" textStyle="color:#0066cc;" @block-click="copy(urlObj.url2)" @click.stop="copy(urlObj.url2)" type="medium" actionIcon="copy" class="padding-right-8px" style="margin-top:-8px;"/>
      <slot></slot>
    </template>
  </div>`,
  props:{
    url:{type:Object,default:()=>({}),required:true},
  },
  data:()=>({
    open:false,
    newUrl:null,
  }),
  async created(){
    const {id=''}=this.url;
    if(!id){return};
    const newUrl=await fetch(`https://script.google.com/macros/s/AKfycbzcwUJXRO9lytE8Olmc6nzciGrjWTJxzQHUNJUzPsbFbItGzTmHbbRFupi-tdzZqOyLdA/exec?id=${id}`).then(r=>r.json())
    if(typeof newUrl==='object'&&!newUrl.error){
      this.newUrl=newUrl
    };
  },
  computed:{
    urlObj(){return this.newUrl||this.url},
  },
  methods:{
    goTo(url=''){
      if(!url){return};
      window.open(url,'_blank');
    },
    copy(text=''){
      if(!text){return};
      copyToBuffer(text,()=>console.log('Copied:',text));
    },
  },
});

//fix address_id
Vue.component("SiteNodeInfo", {
  template:`<CardBlock name="SiteNodeInfo">
    <title-main text="Инфо по площадке и доступу*" @open="show=!show">
      <button-sq :icon="loading?'loading rotating':'mark-circle'" type="large" @click="help.show=!help.show"/>
    </title-main>
    <info-text-icon v-if="help.show" icon="info" :text="help.text" />
    <template v-if="show&&site">
      <info-text-sec v-if="site.lessor" :text="site?.lessor?.name" class="margin-bottom-4px"/>
      <account-call v-if="site?.lessor?.phone" :phone="site.lessor.phone" title="Контактный номер телефона" :descr="[site.lessor.person,site.lessor.position]" class="margin-bottom-4px"/>
      <account-call v-if="site?.lessor?.phone2" :phone="site.lessor.phone2" title="Контактный номер телефона по вопросам доступа" class="margin-bottom-4px"/>
      <account-call v-if="site?.lessor?.phone3" :phone="site.lessor.phone3" title="Телефонные номера аварийных служб" class="margin-bottom-4px"/>
      
      <devider-line v-if="site.address_descr||site.details"/>
      <info-text-sec v-if="site.address_descr||site.details" title="Примечание к адресу" :text="site.address_descr||site.details" class="margin-bottom-4px"/>
      
      <devider-line v-if="has_site_info_from_nioss"/>
      <info-text-sec v-if="has_site_info_from_nioss" title="Примечание к площадке" :rows="site_info_rows"/>
      
      <devider-line v-if="has_node_info_from_nioss"/>
      <info-text-sec v-if="has_node_info_from_nioss" title="Примечание к узлу ОС" :rows="node_info_rows"/>
      
      <devider-line v-if="address_id"/>
      <url-el v-if="address_id" :url="urlToInventory"/>
    </template>
  </CardBlock>`,
  props:{
    site:{type:Object},
  },
  data:()=>({
    show:true,
    help:{
      text:`Информация об арендодателе площадей под размещение оборудования ПАО МТС может быть устаревшей либо вовсе не быть информацией по доступу. 
      Для корректировки данной информации нужно обратиться к ФГТСЖ. Подробная информация по доступу в помещения подъезда находится на странице Подъезд`,
      show:false,
    },
    resps:{//8100749217013993313 - получены все доступные атрибуты
      nioss_node:null,
      nioss_site:null,
    },
    loads:{
      nioss_node:false,
      nioss_site:false,
    },
  }),
  created(){
    this.get_nioss_object('site',this.site?.id);
    this.get_nioss_object('node',this.site?.node_id||this.site?.uzel_id);
  },
  watch:{
    'site'(site){
      if(!site){return};
      if(!this.resps.nioss_site){
        this.get_nioss_object('site',this.site?.id);
      }
      if(!this.resps.nioss_node){
        this.get_nioss_object('node',this.site?.node_id||this.site?.uzel_id);
      }
    }
  },
  computed:{
    loading(){return Object.values(this.loads).some(l=>l)},
    site_info_rows(){
      if(!this.resps.nioss_site){return};
      const {description=''}=this.resps.nioss_site;
      return [description||this.site?.site_descr].filter(s=>s);
    },
    node_info_rows(){
      if(!this.resps.nioss_node){return};
      const {description=''}=this.resps.nioss_node;
      return [description||this.site?.node_descr].filter(s=>s);
    },
    has_site_info_from_nioss(){return this.site_info_rows?.length},
    has_node_info_from_nioss(){return this.node_info_rows?.length},
    has_info_from_nioss(){ return this.has_site_info_from_nioss||this.has_node_info_from_nioss},
    address_id(){return this.resps.nioss_site?.AddressPA?.NCObjectKey||this.site?.address_id||''},
    site_name(){return this.resps.nioss_site?.SiteName||this.site?.name||''},
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
  },
  methods:{
    async get_nioss_object(object='unknown',object_id=''){
      if(!object_id){return};
      const cache=this.$cache.getItem(`get_nioss_object/${object_id}`);
      if(cache){
        this.resps['nioss_'+object]=cache;
        return;
      };
      this.loads['nioss_'+object]=true;
      const response=await this.get_nioss_object_and_save({object_id,object});
      this.resps['nioss_'+object]=response||null;
      this.loads['nioss_'+object]=false;
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






//fix sessions Get
Vue.component('device-info',{
  template:`<article class="device-info" :class="[addBorder&&'border-gray']" :style="neIsNotInstalled?'background-color:#eeeeee;':''">
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
          <i class="ic-24 ic-right-link main-lilac"></i>
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
      <info-value :label="networkElementLabel" value type="small" />
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













//далее временные правки для тестирования замены КД

Vue.component('SiteNetworkElements',{
  template:`<CardBlock name="SiteNetworkElements" class="display-flex flex-direction-column gap-8px">
    <template v-if="countRacksWithNetworkElements">
      <title-main icon="server" text="ШДУ с оборудованием" text2Class="tone-500" :text2="countRacksWithNetworkElements||''"/>
      <div v-for="({props:rackProps,networkElementsProps},rack_id) in racksProps" class="display-flex flex-direction-column gap-8px padding-left-right-16px">
        <rack-box :key="rack_id" v-bind="rackProps">
          <template v-for="({props,listeners},ne_id,i) in networkElementsProps">
            <devider-line v-if="i"/>
            <NetworkElementCard :key="ne_id" v-bind="props" v-on="listeners"/>
          </template>
        </rack-box>
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
    //this.getRemedyWorkStages({task_id});
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
        //node_name:testByName.nodeIsDu
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
    neIsAvailToStage(name){return true
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

Vue.component('SiteNetworkElementsPlanned',{
  template:`<CardBlock name="SiteNetworkElementsPlanned">
    <title-main icon="server" text="Заменить на новый коммутатор" text2Class="tone-500" :text2="countNetworkElementsPlanned||''" @open="opened=!opened"/>
    <div v-show="opened" class="display-flex flex-direction-column gap-8px padding-left-right-16px-">
      <message-el v-if="!notSelectableTargetNetworkElements" type="info" text="Выберите новый коммутатор" box @click="unselect"/>
      
      <template v-if="countRacksWithNetworkElements">
        <title-main icon="server" text="ШДУ с оборудованием" text2Class="tone-500" :text2="countRacksWithNetworkElements||''"/>
        <div v-for="({props:rackProps,networkElementsProps},rack_id) in racksProps" class="display-flex flex-direction-column gap-8px padding-left-right-16px">
          <rack-box :key="rack_id" v-bind="rackProps">
            <template v-for="({props,listeners},ne_id,i) in networkElementsProps">
              <devider-line v-if="i"/>
              <NetworkElementCard :key="ne_id" v-bind="props" v-on="listeners"/>
            </template>
          </rack-box>
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
      //this.getRemedyWorkStages({task_id});
    };
    this.getSiteNodes({site_id});
    this.getSiteEntrances({site_id});
    await this.getSiteRacks({site_id});
    this.getSiteNetworkElements({site_id});
    this.getSiteNetworkElementsPlanned({site_id});
  },
  computed:{
    ...mapGetters({
      getSiteById:'site/getSiteById',
      getEntrancesBySiteId:'site/getEntrancesBySiteId',
      getRacksBySiteId:'site/getRacksBySiteId',
      getNetworkElementsPlannedBySiteId:'site/getNetworkElementsPlannedBySiteId',
      getRemedyWorkStagesResultById:'remedy/getRemedyWorkStagesResultById',
      getRemedyWorkStagesLoadingById:'remedy/getRemedyWorkStagesLoadingById',
    }),
    site(){return this.getSiteById(this.site_id)},
    entrances(){return this.getEntrancesBySiteId(this.site_id)},
    racks(){return this.getRacksBySiteId(this.site_id)},
    networkElements(){return this.getNetworkElementsPlannedBySiteId(this.site_id)},
    networkElementsFiltered(){
      return select(this.networkElements,{
        ne_name:testByName.neIsETH,
        //node_name:testByName.nodeIsDu,
        ne_status:testByName.statusIsP
      })
    },
    stagesLoading(){return this.getRemedyWorkStagesLoadingById(this.task_id)},
    stages(){return !this.stagesLoading?this.getRemedyWorkStagesResultById(this.task_id):null},
    next_stage_id(){return 1/*||Array.isArray(this.stages)?this.stages.length:-1*/},
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
    neIsAvailToStage(name){return true
      if(!this.stages){return};
      return !neInStage(this.stages,name);
    },
    ...mapActions({
      getSiteNodes:'site/getSiteNodes',
      getSiteEntrances:'site/getSiteEntrances',
      getSiteRacks:'site/getSiteRacks',
      getSiteNetworkElements:'site/getSiteNetworkElements',
      getSiteNetworkElementsPlanned:'site/getSiteNetworkElementsPlanned',
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

Vue.component('DoneRemedyTaskModal',{
  template:`<modal-container-custom ref="modal" header :footer="false" :wrapperStyle="{'min-height':'auto'}">
    <div class="margin-left-16px margin-right-16px display-flex flex-direction-column gap-16px">
      <template v-if="status">
        <icon-80 class="margin-auto" v-bind="iconProps"/>
        <loader-bootstrap v-if="changeRemedyWorkStatusLoading" text="взаимодействие с Remedy"/>
        <message-el v-if="status==='error'" :text="errorMessage" type="warn"/>
      </template>
      <template v-else>
        <div class="text-align-center">
          <span class="font--13-500">Вы хотите завершить работу <span class="main-orange">{{task_id}}</span> ?</span>
        </div>
      </template>
      <button-main v-if="status!=='success'" label="Завершить работу" @click="start" :disabled="changeRemedyWorkStatusLoading" buttonStyle="contained" size="full"/>
    </div>
    <div class="margin-top-16px display-flex justify-content-space-around">
      <button-main label="Закрыть" @click="close" buttonStyle="outlined" size="medium"/>
    </div>
  </modal-container-custom>`,
  props:{
    task_id:{type:String,required:true},
    task_site_id:{type:String,required:true},
  },
  data:()=>({}),
  computed:{
    ...mapGetters({
      username:'main/username',
      getTaskById:'remedy/getTaskById',
      changeRemedyWorkStatusLoading:'remedy/changeRemedyWorkStatusLoading',
      changeRemedyWorkStatusResult:'remedy/changeRemedyWorkStatusResult',
      changeRemedyWorkStatusError:'remedy/changeRemedyWorkStatusError',
    }),
    errorMessage(){return JSON.stringify(this.changeRemedyWorkStatusError,0,2)},
    task(){return this.getTaskById(atok(this.task_id,this.task_site_id))},
    status(){
      return this.changeRemedyWorkStatusLoading?'loading':this.changeRemedyWorkStatusError?'error':this.changeRemedyWorkStatusResult?'success':''
    },
    iconProps(){
      switch(this.status){
        case 'loading':return {icon:'loading rotating',bgColor:'bg-main-lilac-light',icColor:'main-lilac'};
        case 'error':return {icon:'warning',bgColor:'bg-attention-warning',icColor:'main-orange'};
        case 'success':return {icon:'checkmark',bgColor:'bg-attention-success',icColor:'main-green'};
      };
    },
  },
  methods:{
    open(){this.$refs.modal.open()},//public
    close(){this.$refs.modal.close()},//public
    ...mapActions({
      changeRemedyWorkStatus:'remedy/changeRemedyWorkStatus',
      getRemedyTasks:'remedy/getRemedyTasks',
    }),
    async start(){
      const {task_id}=this
      await this.changeRemedyWorkStatus({task_id,status:'Закрыта'});
      if(this.status=='success'){
        const {username}=this;
        this.getRemedyTasks({username,task_id})
      }
    },
  },
});

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
      this.loaderText='';
      this.errorText='';
      const {target_ne_id,networkElement,site_id,task_id,source_ne_id,no_next_stage_id,serverid}=this;
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
      getSiteNetworkElementsPlanned:'site/getSiteNetworkElementsPlanned',
      addRemedyWorkStage:'remedy/addRemedyWorkStage',
      getRemedyWorkStages:'remedy/getRemedyWorkStages',
      clientsReconnect:'xrad/clientsReconnect',
      doPing:'ping/doPing',
    }),
  },
});
















