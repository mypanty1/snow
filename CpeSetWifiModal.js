//fix auto channel
Vue.component('CpeSetWifiModal',{
  template:`<modal-container-custom name="CpeSetWifiModal" ref="modal" :disabled="cpeUpdateLoading" @open="onModalOpen" @close="onModalClose" header :footer="false" :wrapperStyle="{'min-height':'auto','margin-top':'4px'}">
    <div class="margin-left-right-16px">
      <header class="margin-top-8px">
        <div class="font--18-600 tone-900 text-align-center">Wi-Fi</div>
        <div class="font--13-500 tone-500 text-align-center white-space-pre">{{$route.params.serial}} • {{$route.params.account}}</div>
      </header>
      
      <section class="margin-top-8px">
        <div class="display-flex align-items-center justify-content-space-between gap-4px">
          <div class="font--13-500" :class="[!commonMode&&'tone-500']">Настроить для всех диапазонов</div>
          <switch-el class="width-40px" v-model="commonMode" :disabled="cpeUpdateLoading"/>
        </div>
        <template v-if="commonMode">
          <div>
            <input-el label="Общее имя сети" v-model="commonSsid" :error="!!verifySsidText" :disabled="cpeUpdateLoading" placeholder="Не более 20 символов"/>
            <input-error :text="verifySsidText"/>
          </div>
          <div>
            <input-el label="Пароль для подключения" v-model="commonPass" :error="!!verifyPassText" :disabled="cpeUpdateLoading" placeholder="Не менее 8 символов"/>
            <input-error :text="verifyPassText"/>
          </div>
        </template>
      </section>
      
      <SectionBorder class="margin-top-8px position-relative" :class="[!wlan24_isEnabled&&'bg-tone-150']">
        <title-main :icon="'wifi'+(wlan24_isEnabled?' main-green':'')" text="2.4 ГГц сеть" :text2="!wlan24_isEnabled?'Отключена':''" text2Class="font--13-500 tone-500" @block-click="show.wlan24=!show.wlan24" :opened="show.wlan24"/>
        <div class="position-absolute" v-if="!wlan24_isEnabled" style="border-top:2px solid red;width:20px;top:19px;left:15px;transform:rotateZ(45deg);"></div>
        <template v-if="show.wlan24">
          <devider-line/>
          <div class="display-flex flex-direction-column gap-8px margin-8px">
            <div class="display-flex align-items-center justify-content-space-between gap-4px">
              <div class="font--13-500" :class="[!wlan24_isEnabled&&'tone-500']">2.4 ГГц Включен</div>
              <switch-el class="width-40px" v-model="wlan24_isEnabled" :disabled="cpeUpdateLoading"/>
            </div>
            <div>
              <input-el label="Имя сети 2.4 ГГц" v-model="wlan24_ssid" :error="!!verifySsid24Text" :disabled="commonMode||!!commonSsid||!wlan24_isEnabled||cpeUpdateLoading" placeholder="Не более 25 символов"/>
              <input-error :text="verifySsid24Text"/>
            </div>
            <div>
              <input-el label="Пароль для подключения" v-model="wlan24.pass" :error="!!verifyPass24Text" :disabled="commonMode||!!commonPass||!wlan24_isEnabled||cpeUpdateLoading" placeholder="Не менее 8 символов"/>
              <input-error :text="verifyPass24Text"/>
            </div>
            <div class="display-flex align-items-center justify-content-space-between gap-4px">
              <div class="font--13-500" :class="[!wlan24_isVisible&&'tone-500']">Сеть видна всем</div>
              <switch-el class="width-40px" v-model="wlan24_isVisible" :disabled="!wlan24_isEnabled||cpeUpdateLoading"/>
            </div>
            <select-el label="Радиорежим 2,4 ГГц" v-model="wlan24.beacontype" :items="beacontype_items" :disabled="!wlan24_isEnabled||cpeUpdateLoading"/>

            <div class="display-flex align-items-center justify-content-space-between gap-4px">
              <div class="font--13-500" :class="[!wlan24_isAutoBandwidthEnabled&&'tone-500']">Ширина канала автоматически</div>
              <switch-el class="width-40px" v-model="wlan24_isAutoBandwidthEnabled" :disabled="cpeUpdateLoading||!0"/>
            </div>
            <select-el label="Ширина канала (МГц)" v-model="wlan24.bandwidth" :items="wlan24_bandwidth_items" :disabled="!wlan24_isEnabled||wlan24_isAutoBandwidthEnabled||cpeUpdateLoading"/>

            <div class="display-flex align-items-center justify-content-space-between gap-4px">
              <div class="font--13-500" :class="[!wlan24_isAutoChannelEnabled&&'tone-500']">Выбор канала автоматически</div>
              <switch-el class="width-40px" v-model="wlan24_isAutoChannelEnabled" :disabled="cpeUpdateLoading"/>
            </div>
            <select-el label="Канал 2,4 ГГц" v-model="wlan24.channel" :items="wlan24_possiblechannels_items" :disabled="!wlan24_isEnabled||wlan24_isAutoChannelEnabled||cpeUpdateLoading"/>
          </div>
        </template>
      </SectionBorder>
      
      <SectionBorder class="margin-top-8px position-relative" :class="[!wlan5_isEnabled&&'bg-tone-150']">
        <title-main :icon="'wifi'+(wlan5_isEnabled?' main-green':'')" text="5 ГГц сеть" :text2="!wlan5_isEnabled?'Отключена':''" text2Class="font--13-500 tone-500" @block-click="show.wlan5=!show.wlan5" :opened="show.wlan5"/>
        <div class="position-absolute" v-if="!wlan5_isEnabled" style="border-top:2px solid red;width:20px;top:19px;left:15px;transform:rotateZ(45deg);"></div>
        <template v-if="show.wlan5">
          <devider-line/>
          <div class="display-flex flex-direction-column gap-8px margin-8px">
            <div class="display-flex align-items-center justify-content-space-between gap-4px">
              <div class="font--13-500" :class="[!wlan5_isEnabled&&'tone-500']">5 ГГц Включен</div>
              <switch-el class="width-40px" v-model="wlan5_isEnabled" :disabled="cpeUpdateLoading"/>
            </div>
            <div>
              <input-el label="Имя сети 5 ГГц" v-model="wlan5_ssid" :error="!!verifySsid5Text" :disabled="commonMode||!!commonSsid||!wlan5_isEnabled||cpeUpdateLoading" placeholder="Не более 25 символов"/>
              <input-error :text="verifySsid5Text"/>
            </div>
            <div>
              <input-el label="Пароль для подключения" v-model="wlan5.pass" :error="!!verifyPass5Text" :disabled="commonMode||!!commonPass||!wlan5_isEnabled||cpeUpdateLoading" placeholder="Не менее 8 символов"/>
              <input-error :text="verifyPass5Text"/>
            </div>
            <div class="display-flex align-items-center justify-content-space-between gap-4px">
              <div class="font--13-500" :class="[!wlan5_isVisible&&'tone-500']">Сеть видна всем</div>
              <switch-el class="width-40px" v-model="wlan5_isVisible" :disabled="!wlan5_isEnabled||cpeUpdateLoading""/>
            </div>
            <select-el label="Радиорежим 5 ГГц" v-model="wlan5.beacontype" :items="beacontype_items" :disabled="!wlan5_isEnabled||cpeUpdateLoading"/>
            
            <div class="display-flex align-items-center justify-content-space-between gap-4px">
              <div class="font--13-500" :class="[!wlan5_isAutoBandwidthEnabled&&'tone-500']">Ширина канала автоматически</div>
              <switch-el class="width-40px" v-model="wlan5_isAutoBandwidthEnabled" :disabled="cpeUpdateLoading||!0"/>
            </div>
            <select-el label="Ширина канала (МГц)" v-model="wlan5.bandwidth" :items="wlan5_bandwidth_items" :disabled="!wlan5_isEnabled||wlan5_isAutoBandwidthEnabled||cpeUpdateLoading"/>
            
            <div class="display-flex align-items-center justify-content-space-between gap-4px">
              <div class="font--13-500" :class="[!wlan5_isAutoChannelEnabled&&'tone-500']">Выбор канала автоматически</div>
              <switch-el class="width-40px" v-model="wlan5_isAutoChannelEnabled" :disabled="cpeUpdateLoading"/>
            </div>
            <select-el label="Канал 5 ГГц" v-model="wlan5.channel" :items="wlan5_possiblechannels_items" :disabled="!wlan5_isEnabled||wlan5_isAutoChannelEnabled||cpeUpdateLoading"/>
          </div>
        </template>
      </SectionBorder>
      
      <section class="margin-top-8px">
        <div class="display-flex align-items-center justify-content-space-between gap-4px">
          <div class="font--13-500" :class="[!wps_ena_isEnabled&&'tone-500']">Защищенная настройка Wi-Fi (WPS)</div>
          <switch-el class="width-40px" v-model="wps_ena_isEnabled" :disabled="cpeUpdateLoading||true"/>
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
        <button-main label="Закрыть" @click="close" :disabled="cpeUpdateLoading" buttonStyle="outlined" size="content" icon="close-1"/>
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
    show:{
      wlan24:false,
      wlan5:false,
    },
    commonMode:true,
    commonSsid:'',
    commonPass:'',
    wps_ena_isEnabled:false,
    wlan24_isEnabled:false,
    wlan5_isEnabled:false,
    wlan24_isVisible:false,
    wlan5_isVisible:false,
    wlan24_isAutoChannelEnabled:false,
    wlan5_isAutoChannelEnabled:false,
    wlan24_isAutoBandwidthEnabled:false,
    wlan5_isAutoBandwidthEnabled:false,
    wlan24_ssid:'',
    wlan5_ssid:'',
    wlan24:{
      visibility:null,
      bandwidth:null,
      autobandwidthenable:null,
      beacontype:null,
      channel:null,
      autochannelenable:null,
      enabled:null,
      ssid:'',
      pass:null,
    },
    wlan5:{
      visibility:null,
      bandwidth:null,
      autobandwidthenable:null,
      beacontype:null,
      channel:null,
      autochannelenable:null,
      enabled:null,
      ssid:'',
      pass:'',
    },
  }),
  watch:{
    'commonSsid'(commonSsid){
      if(commonSsid){
        this.wlan24_ssid=`MTS_${commonSsid}`;
        this.wlan5_ssid=`MTS_${commonSsid}`;
      }else{
        this.wlan24_ssid=this.wlan24.ssid;
        this.wlan5_ssid=this.wlan5.ssid;
      }
    },
    'commonPass'(commonPass){
      this.wlan24.pass=commonPass||'';
      this.wlan5.pass=commonPass||'';
    },
    'commonMode'(commonMode){
      if(!commonMode){
        this.commonSsid='';
        this.commonPass='';
      }
    },
    'cpeUpdateLoading'(cpeUpdateLoading){
      if(cpeUpdateLoading){
        this.show.wlan24=false;
        this.show.wlan5=false;
      }
    }
  },
  computed:{
    ...mapGetters({
      cpe:'cpe/getCpeResult',
      cpeUpdateLoading:'cpe/doCpeUpdateLoading',
      cpeUpdateResult:'cpe/doCpeUpdateResult',
    }),
    wlan24_bandwidth_items(){return [...new Set([...ACS_CPE.wlan24.bandwidth.items,this.wlan24.bandwidth])].filter(Boolean)},
    wlan5_bandwidth_items(){return [...new Set([...ACS_CPE.wlan24.bandwidth.items,this.wlan5.bandwidth])].filter(Boolean)},
    beacontype_items(){return [...new Set(['11i',this.wlan24.beacontype,this.wlan5.beacontype])].filter(Boolean)},
    wps_ena(){return this.cpe?.wps_ena},
    wlans(){return this.cpe?.wlans||[]},
    wlan24_initial(){return this.wlans.find(({lan})=>lan==='wlan24')},
    wlan5_initial(){return this.wlans.find(({lan})=>lan==='wlan5')},
    wlan24_possiblechannels_items(){return [...new Set([...this.wlan24_initial?.possiblechannels||[],this.wlan24.channel])].filter(Boolean)},
    wlan5_possiblechannels_items(){return [...new Set([...this.wlan5_initial?.possiblechannels||[],this.wlan5.channel])].filter(Boolean)},
    verifySsidText(){return this.commonSsid?.length>21?'Не более 20 символов':''},
    verifyPassText(){return !this.commonPass?.length?'':this.commonPass?.length<8?'Не менее 8 символов':''},
    verifySsid24Text(){return (!this.wlan24_ssid?.length||this.wlan24_ssid?.length>25)?'Не более 25 символов':''},
    verifySsid5Text(){return (!this.wlan5_ssid?.length||this.wlan5_ssid?.length>25)?'Не более 25 символов':''},
    verifyPass24Text(){return !this.wlan24.pass?.length?'':this.wlan24.pass?.length<8?'Не менее 8 символов':''},
    verifyPass5Text(){return !this.wlan5.pass?.length?'':this.wlan5.pass?.length<8?'Не менее 8 символов':''},
    verifyText(){return this.verifySsidText||this.verifyPassText||this.verifySsid24Text||this.verifySsid5Text||this.verifyPass24Text||this.verifyPass5Text},
  },
  methods:{
    open(){//public
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
      this.wps_ena_isEnabled=this.wps_ena=='Up';
      this.wlan24 = {
        visibility: this.wlan24_initial.visibility,
        bandwidth: this.wlan24_initial.bandwidth,
        autobandwidthenable: this.wlan24_initial.autobandwidthenable,
        beacontype: this.wlan24_initial.beacontype,
        channel: +this.wlan24_initial.channel,
        autochannelenable: this.wlan24_initial.autochannelenable,
        enabled: this.wlan24_initial.enabled,
        ssid: this.wlan24_initial.ssid,
        pass: '',
      };
      this.wlan5 = {
        visibility: this.wlan5_initial.visibility,
        bandwidth: this.wlan5_initial.bandwidth,
        autobandwidthenable: this.wlan5_initial.autobandwidthenable,
        beacontype: this.wlan5_initial.beacontype,
        channel: +this.wlan5_initial.channel,
        autochannelenable: this.wlan5_initial.autochannelenable,
        enabled: this.wlan5_initial.enabled,
        ssid: this.wlan5_initial.ssid,
        pass: '',
      };
      this.wlan24_isEnabled=this.wlan24.enabled=='Up';
      this.wlan5_isEnabled=this.wlan5.enabled=='Up';
      this.wlan24_isVisible=this.wlan24.visibility=='Up';
      this.wlan5_isVisible=this.wlan5.visibility=='Up';
      this.wlan24_isAutoChannelEnabled=this.wlan24.autochannelenable=='Up';
      this.wlan5_isAutoChannelEnabled=this.wlan5.autochannelenable=='Up';
      this.wlan24_isAutoBandwidthEnabled=this.wlan24.autobandwidthenable=='Up';
      this.wlan5_isAutoBandwidthEnabled=this.wlan5.autobandwidthenable=='Up';
      this.wlan24_ssid=this.wlan24.ssid;
      this.wlan5_ssid=this.wlan5.ssid;
    },
    ...mapActions({
      doCpeUpdate:'cpe/doCpeUpdate',
      getCpe:'cpe/getCpe',
      reset:'cpe/reset',
    }),
    async save(){
      this.wlan24.enabled=this.wlan24_isEnabled?'Up':'Down';
      this.wlan5.enabled=this.wlan5_isEnabled?'Up':'Down';
      this.wlan24.visibility=this.wlan24_isVisible?'Up':'Down';
      this.wlan5.visibility=this.wlan5_isVisible?'Up':'Down';
      this.wlan24.autochannelenable=this.wlan24_isAutoChannelEnabled?'Up':'Down';
      this.wlan5.autochannelenable=this.wlan5_isAutoChannelEnabled?'Up':'Down';
      this.wlan24.autobandwidthenable=this.wlan24_isAutoBandwidthEnabled?'Up':'Down';
      this.wlan5.autobandwidthenable=this.wlan5_isAutoBandwidthEnabled?'Up':'Down';
      this.wlan24.ssid=this.wlan24_ssid.replace(/(_|-|)(2.4|5)GHz(_|-|)/gi,'');//префикс подставляется на BE
      this.wlan5.ssid=this.wlan5_ssid.replace(/(_|-|)(2.4|5)GHz(_|-|)/gi,'');//префикс подставляется на BE
      await this.doCpeUpdate({
        ...this.$route.params,
        //...this.wps_ena_isEnabled!=this.wps_ena?{wps_ena:this.wps_ena_isEnabled?'Up':'Down'}:null,
        wlan24:ACS_CPE.getDiffParams({...this.wlan24_initial,pass:''},this.wlan24),
        wlan5:ACS_CPE.getDiffParams({...this.wlan5_initial,pass:''},this.wlan5),
      });
      if(this.cpeUpdateResult?.key){
        this.getCpe(this.$route.params);
        this.reset('doCpeUpdate');
      }
    },
  },
});
Vue.component('CpeWlan',{
  template:`<div name="CpeWlan">
    <devider-line/>
    <title-main :icon="statusIcon" :text="moduleName" :text2="disabledText" text2Class="tone-500" :opened="open.wlanModule" @block-click="open.wlanModule=!open.wlanModule"/>
    <div v-show="open.wlanModule">

      <info-value label="Имя сети" :value="wlan.ssid" type="medium" withLine/>
      <info-value label="Радиорежим" :value="wlan.standard" type="medium" withLine/>
      <info-value label="Ширина канала" :value="wlan.bandwidth" type="medium" withLine/>
      <info-value label="Канал авто" v-if="isAutoChannelEnabled" :value="wlan.channel" type="medium" withLine/>
      <info-value label="Канал вещания" v-else :value="wlan.channel" type="medium" withLine/>
      <info-value label="Видимость сети" :value="visibleSsidText" type="medium" withLine/>
      <info-value label="WPS" v-if="wps" :value="wpsModeText" type="medium" withLine/>
      
      <title-main icon="factors" text="Подключения" :text2="hostsCountText||'нет'" :text2Class="hostsCountClass" size="medium" :opened="open.hosts" @block-click="open.hosts=!open.hosts"/>
      <CpeHost v-show="open.hosts" v-for="host of hostsSortedByUptime" :key="host.ip" :host="host" class="margin-left-16px" style="border-left:1px solid #221e1e26;border-bottom:1px solid #221e1e26;padding-bottom:4px;"/>

    </div>
  </div>`,
  props:{
    wlan:{type:Object,default:()=>({}),requred:true},
    wps:{type:String,default:''},
  },
  data:()=>({
    open:{
      wlanModule:true,
      hosts:false,
    },
  }),
  computed:{
    moduleName(){return 'модуль '+(this.wlan.lan==='wlan5'?'5 ГГц':'2,4 ГГц')},
    disabledText(){return this.wlan.enabled!=='Up'?'отключен':''},
    statusIcon(){return '- ic-status '+(this.wlan.status==='Up'?'main-green':'tone-300')},
    visibleSsidText(){return this.wlan.visibility==='Up'?'Открыта':'Закрыта'},
    hostsCountText(){return this.wlan?.hosts?.length||''},
    hostsCountClass(){return !this.hostsCountText?'tone-500':''},
    hostsSortedByUptime(){return [...this.wlan.hosts||[]].sort((a,b)=>a.uptime-b.uptime)},
    wpsModeText(){return !this.wps?'Нет данных':this.wps==='Up'?'Включен':'Выключен'},
    isAutoChannelEnabled(){return this.wlan.autochannelenable==='Up'},
  },
});
