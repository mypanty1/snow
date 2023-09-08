//add refresh resources and siebel requests history
Vue.component('ForisContent',{
  template: `<section name="ForisContent" class="account-page">
    <CardBlock>
      <title-main :text="account.personal_account_number" :text2="account.msisdn?'Конвергент':''" text2Class="lbsv-account__convergent">
        <div slot="prefix">
          <IcIcon name="status" :class="accountIsActive?'main-green':'main-red'"/>
        </div>
      </title-main>
      
      <template v-if="address">
        <devider-line />
        <info-text-icon :text="address" type="medium" icon=""/>
      </template>
      
      <devider-line />
      <title-main icon="person" :text="account.customer_name" class="text-transform-capitalize" />
      
      <div class="display-flex flex-direction-column gap-8px padding-left-right-16px">
        <PhoneCall v-if="!phoneIsVirtual" :isConvergent="account.msisdn" :phone="account.msisdn" showSendSms/>
        <PhoneCall v-if="contactPhone && account.msisdn != contactPhone" :phone="contactPhone" showSendSms/>
        <SendKionPq v-if="contactPhone||account.msisdn" :phones="[contactPhone,account.msisdn]" :account="accountId"/>
      </div>
      
      <devider-line />
      <info-value icon="purse" :value="balance" type="extra" label="Баланс"/>
      <info-value icon="clock" :value="lastPayment" type="extra" label="Платеж" />
      
      <devider-line/>
      <SiebelServiceRequests :agreementNum="account.contract_number"/>
      
      <template v-if="favBtnProps">
        <devider-line/>
        <FavBtnLinkBlock v-bind="favBtnProps"/>
      </template>
    </CardBlock>

    <CardBlock>
      <title-main icon="accidents" @block-click="$router.push({name:'account-events',params:{accountId}})" text="Работы по абоненту" :attention="hasActiveIncident?'warn':null">
        <button-sq icon="right-link" class="pointer-events-none"/>
      </title-main>
    </CardBlock>
    
    <CardBlock class="padding-left-right-16px">
      <TabSelector :items="items" @onSelect="selected=$event" class="width-100-100">
        <div slot="prefix" class="font--13-500 margin-right-4px">Группировка</div>
      </TabSelector>
    </CardBlock>
    
    <ForisResources v-if="selected?.name=='Услуги'" :account="account" :resources="resources" :loading="loads.getForisAccountResources" :accessPoint="resps.getAccountAccessPoint" :accessPointLoading="loads.getAccountAccessPoint" @updateResources="getForisResourcesInfo"/>
    <ForisPackages v-else-if="selected?.name=='Пакеты'" :packages="packages"/>
    <ForisServices v-else-if="selected?.name=='Список'" :services="services"/>
    
    <foris-account-block-history :history="resps.getForisAccountBlockHistory||[]"/>
  </section>`,
  props:{
    account:{type:Object,required:true},
    accountId:{type:String,required:true},
    mr_id:{type:Number,required:true},
    flatData:{type:Object,default:null},
    building:{type:Object,default:null},
    entrance:{type:Object,default:null},
    flat:{type:Object,default:null},
    //accountResponse:{type:Object},
  },
  beforeRouteEnter(to,from,next){
    if(!to.params.account){
      next({name:'search',params:{text:to.params.accountId}});
      return;
    };
    next();
  },
  data:()=>({
    selected:null,
    items:[
      {name:'Услуги'},
      {name:'Пакеты'},
      {name:'Список'},
    ],
    loads:{
      getForisAccountResources:false,
      getForisAccountPayments:false,
      getForisAccountBlockHistory:false,
      getForisAccountContacts:false,
      getAccountAccessPoint:false,
      getForisAccountInternetsLoginPass:false,
      getAccountInternetsAuthTypes:false,
      getAccountInternetsUserRates:false,
    },
    resps:{
      getForisAccountResources:null,
      getForisAccountPayment:null,
      getForisAccountBlockHistory:null,
      getForisAccountContacts:null,
      getAccountAccessPoint:null,
      getForisAccountInternetsLoginPass:null,
      getAccountInternetsAuthTypes:null,
      getAccountInternetsUserRates:null,
    },
  }),
  created(){
    this.getForisAccountPayment();
    this.getForisAccountBlockHistory();
    this.getForisAccountContacts();
    this.getForisResourcesInfo();
  },
  computed:{
    favBtnProps(){
      if(!this.account){return};
      const {address,accountId,account:{msisdn}}=this;
      return {
        title:`Абонент ${truncateSiteAddress(address).replace(/(, )/,',')}`,
        name:accountId,
        id:accountId,
        path:`/${accountId}`,//если открыт из наряда
        descr:[
          objectToTable(filterKeys({},{
            '!1':['ЛС',accountId],
            '!2':['Конвергент',msisdn||'-']
          }))
        ].join('\n'),
      }
    },
    resources(){
      const {internet=[],...other}=this.resps.getForisAccountResources||{};
      return {internet,...other}
    },
    services(){
      return Object.values(this.resources).flat();
    },
    packages(){
      return this.services.reduce((packages,service)=>{
        const packageProduct=service.products.find(({service_parameter})=>(service_parameter||[]).find(({name})=>name=="Идентификационный номер продукта"));
        if(!packageProduct){return packages};
        const packageProductId=packageProduct.service_parameter.find(({name})=>name=="Идентификационный номер продукта")?.value;
        const packageProductName=packageProduct.service_parameter.find(({name})=>name=="Наименование продукта")?.value;
        if(packageProductId){
          if(!packages[packageProductId]){packages[packageProductId]={packageProductId,packageProductName,services:[]}};
          packages[packageProductId].services.push(service)
        }
        return packages
      },{})
    },
    payment(){return this.resps.getForisAccountPayment},
    events(){return this.resps.getAccountEvents},
    contactPhone(){return this.resps.getForisAccountContacts?.phone},
    accountDevice(){return this.resps.getAccountAccessPoint},
    address(){
      if(this.loads.getForisAccountResources){return ''};
      const {resources,account}=this;
      const addressInternet=(resources?.internet||[]).find(service=>service.address)?.address;
      const addressSome=Object.values(resources).flat().find(service=>service.address)?.address;
      return (addressInternet||addressSome||account.address||'').split(',').map(v=>v.trim()).filter(v=>v).join(', ');
    },
    hasActiveIncident(){return Boolean(this.events?.active?.length)},
    lastPayment(){
      const {payment}=this;
      if(!payment){return};
      const amount=payment.amount?`+ ${payment.amount} ₽`:``;
      return `${amount} ${payment.date_of_payment}`;
    },
    balance(){
      const {account}=this;
      return account.balance?`${account.balance} ₽`:`-`;
    },
    hasInternet(){
      return this.resources?.internet?.length;
    },
    accountIsActive(){
      return this.account.customer.personal_accounts.some(({personal_account_status})=>personal_account_status==='Активен')
    },
    phoneIsVirtual(){
      return this.account.msisdn.startsWith('76');
    }
  },
  methods:{
    async getForisResourcesInfo(){
      this.getForisAccountResources().then(()=>{
        if(!this.hasInternet){
          this.getAccountEvents();
          return
        };
        this.getForisAccountInternetsLoginPass().then(()=>{
          this.getAccountInternetsAuthTypes();
          this.getAccountInternetsUserRates();
        });
        this.getAccountAccessPoint().then(()=>{
          this.getAccountEvents();
        });
      });
    },
    async getForisAccountResources(){
      const {personal_account_number}=this.account;
      this.loads.getForisAccountResources=true;
      try{
        const response=await CustomRequest.get(buildUrl('resources',{
          personal_account_number
        },'/call/v1/foris/'));
        if(response?.internet){
          // convert lbsv type
          if(response.internet?.length){
            response.internet=response.internet.map(service=>{
              service.device=service.device.map(device => ({
                ...device,
                id:device.serial,
                serial:null,
                type:'wifi'
              }))
              return service
            });
          };
          this.resps.getForisAccountResources=response;
        };
      }catch(error){
        console.warn('resources.error',error);
      };
      this.loads.getForisAccountResources=false;
    },
    async getForisAccountPayment(){
      const {personal_account_number}=this.account;
      this.loads.getForisAccountPayment=true;
      try{
        const response=await CustomRequest.get(buildUrl('payments',{
          personal_account_number,
          last:true
        },'/call/v1/foris/'));
        this.resps.getForisAccountPayment=response;
      }catch(error){
        console.warn('payments.error',error);
      }
      this.loads.getForisAccountPayment=false;
    },
    async getForisAccountBlockHistory(){
      const {personal_account_number}=this.account;
      this.loads.getForisAccountBlockHistory=true;
      const before=new Date();before.setMonth(before.getMonth()-3);
      try{
        const response=await CustomRequest.get(buildUrl('blocks_history',{
          personal_account_number,
          from:Datetools.format(before),
          to:Datetools.format(new Date()),
        },'/call/v1/foris/'));
        this.resps.getForisAccountBlockHistory=response;
      }catch(error){
        console.warn('blocks_history.error',error);
      };
      this.loads.getForisAccountBlockHistory = false;
    },
    async getAccountEvents(){
      this.loads.getAccountEvents=true;
      const {account,accountDevice}=this;
      const method=accountDevice?'events_by_contract':'events_by_contract_without_shpd';
      try{
        const response=await httpGet(buildUrl(method,{
          to:new Date(),
          from:Dt.addDays(-1),
          serverid:account.serverid,
          contract:account.personal_account_number,//account.msisdn,//account.contract_number,
          ...accountDevice?{
            device:accountDevice.device.name,
            id:accountDevice.device.nioss_id,
            regionid:accountDevice.region.mr_id,
          }:null,
        }));
        this.resps.getAccountEvents=response;
      }catch(error){
        console.warn(`${method}.error`,error);
      };
      this.loads.getAccountEvents=false;
    },
    async getForisAccountContacts(){
      const {personal_account_number}=this.account;
      this.loads.getForisAccountContacts=true;
      try{
        const response=await CustomRequest.get(buildUrl('contacts',{
          personal_account_number
        },'/call/v1/foris/'));
        this.resps.getForisAccountContacts=response
      }catch(error){
        console.warn('contacts.error',error)
      }
      this.loads.getForisAccountContacts=false;
    },
    async getAccountAccessPoint(){
      const {personal_account_number:account}=this.account;
      this.loads.getAccountAccessPoint=true;
      try{
        const response=await CustomRequest.get(buildUrl('search_by_account',{
          account
        },'/call/v1/device/'));
        if(response.type!='error'){
          this.resps.getAccountAccessPoint=response
        }
      }catch(error){
        console.warn('search_by_account.error',error)
      };
      this.loads.getAccountAccessPoint=false;
    },
    async getForisAccountInternetsLoginPass(){
      const {serverid}=this.account;
      this.loads.getForisAccountInternetsLoginPass=true;
      try{
        await Promise.all((this.resources?.internet||[]).map(({msisdn},index)=>{
          return httpGet(buildUrl('get_login',{
            msisdn,
            serverid,
          },'/call/aaa/'),true).then(response=>{
            if(response.code=="200"&&response?.data?.[0]?.login){
              this.$set(this.resps.getForisAccountResources.internet[index],'login',response.data[0]);
            }
          })
        }));
      }catch(error){
        console.warn("get_login.error",error);
      };
      this.loads.getForisAccountInternetsLoginPass=false;
    },
    async getAccountInternetsAuthTypes(){
      const {serverid}=this.account;
      this.loads.getAccountInternetsAuthTypes=true;
      try{
        await Promise.allSettled((this.resources?.internet||[]).map(({msisdn,login:{login}={}},index)=>{
          return httpGet(buildUrl('get_auth_type',{
            login,
            vgid:msisdn,
            serverid,
            date:'',
          },'/call/aaa/'),true).then(response=>{
            if(response.code=="200"&&response?.data?.[0]?.auth_type){
              this.$set(this.resps.getForisAccountResources.internet[index],'auth_type',response.data[0].auth_type);
            }
          })
        }));
      }catch(error){
        console.warn("get_auth_type.error",error);
      };
      this.loads.getAccountInternetsAuthTypes=false;
    },
    async getAccountInternetsUserRates(){
      const {serverid}=this.account;
      this.loads.getAccountInternetsUserRates=true;
      try{
        await Promise.allSettled((this.resources?.internet||[]).map(({msisdn,login:{login}={}},index)=>{
          return httpGet(buildUrl('get_user_rate',{
            login,
            vgid:msisdn,
            serverid,
            date:'',
          },'/call/aaa/'),true).then(response=>{
            if(response.code=="200"&&(response?.data?.[0]?.rate||response?.data?.[0]?.rate==0)){
              this.$set(this.resps.getForisAccountResources.internet[index],'rate',`${response.data[0].rate} Мбит/c`);
            }
          })
        }));
      }catch(error){
        console.warn("get_user_rate.error",error);
      };
      this.loads.getAccountInternetsUserRates=false;
    },
  },
});

//add refresh resources and account.mr_id for axiros
Vue.component('ForisResources', {
  template:`<section name="ForisResources">
    <loader-bootstrap v-if="loading" text="получение данных по услугам"/>
    <CardBlock v-for="(services, key) in resources" :key="key" v-if="services.length" class="mini-card margin-top-0">
      <ServicesTypeHeader @open="$set(opened,key,!opened[key])" :open="opened[key]" :type="key" :loading="loading" @refresh="$emit('updateResources')"/>
      <div v-show="opened[key]">
        <CardBlock v-if="key==='internet'">
          <traffic-light-ma v-if="account && accessPoint && !accessPointLoading" :account-device="accessPoint" :account-id="account.personal_account_number" :foris-account="account" :foris-resources="resources" billing-type="foris" @update:online-session="refreshOnlineSessions"/>
          
          <template v-if="accessPoint">
            <title-main text="Порт подключения">
              <button-sq v-if="loads.networkElement" icon="loading rotating"/>
            </title-main>
            <device-info v-if="resps.networkElement" :networkElement="resps.networkElement" :ports="[accessPointServePort]" hideEntrances showLocation addBorder autoSysInfo class="padding-top-bottom-8px margin-left-right-16px"/>
          </template>
        </CardBlock>
        
        <sessions v-if="key=='internet'" billing-type="foris" :foris-account="account" :foris-internet-services="services"/>
      
        <ForisServices :account="account" :services="services" class="margin-top-8px"/>
        <equipment v-for="equipement of (equipements[key]||[])" :key="equipement.id" :mr_id="accessPoint?.region?.mr_id||account.mr_id" :equipment="equipement" :account="account.personal_account_number" />
      </div>
    </CardBlock>
  </section>`,
  props: {
    resources:{type:Object,required:true,default:()=>({})},
    accessPoint:{validator:()=>true},
    loading:{type:Boolean,default:false},
    account:{type:Object,required:true},
    accessPointLoading:{type:Boolean,default:false},
  },
  data:()=>({
    opened:{},
    loads:{
      networkElement:false
    },
    resps:{
      networkElement:null
    },
  }),
  watch:{
    'resources'(resources){
      for(const [key,services] of Object.entries(resources)){
        if(services.length){
          this.$set(this.opened,key,true)
        }
      }
    },
    'accessPoint'(accessPoint){
      if(!accessPoint){return};
      if(!accessPoint?.device?.uzel){
        this.getNetworkElement();
      }else{//адаптер accessPoint
        this.resps.networkElement=accessPoint.device;
      };
    },
  },
  computed:{
    equipements(){
      return Object.entries(this.resources).reduce((equipements,[key,services])=>Object.assign(equipements,{[key]:services.map(({device})=>device).filter(v=>v).flat()}),{})
    },
    accessPointServePort(){
      if(!this.accessPoint?.port){return};
      const {port}=this.accessPoint;
      return {
        device_name:port.device_name,
        port_name:port.name,
        if_index:port.snmp_number,
        if_name:port.snmp_name,
        if_alias:port.snmp_description,
      }
    },
  },
  methods: {
    async getNetworkElement(){
      if(!this.accessPoint?.device?.name){return};
      if(this.resps.networkElement){return};
      this.loads.networkElement=true;
      this.resps.networkElement=null;
      const {name=''}=this.accessPoint.device;
      const cache=this.$cache.getItem(`device/${name}`);
      if(cache){
        this.resps.networkElement=cache;
      }else{
        try{
          let response=await httpGet(buildUrl('search_ma',{pattern:name,component:'lbsv-services'},'/call/v1/search/'));
          if(response.data){
            this.$cache.setItem(`device/${name}`,response.data);
            this.resps.networkElement=response.data;
          };
        }catch(error){
          console.warn('search_ma:device.error',error);
        };
      };
      this.loads.networkElement=false;
    },
    refreshOnlineSessions(){
      if(!this.$refs.sessons){return};
      setTimeout(this.$refs.sessons.refreshSessions,REFRESH_SESSIONS_TIMEOUT);
    },
  }
});

//add refresh
Vue.component('ServicesTypeHeader', {
  template:`<div name="ServicesTypeHeader" class="display-contents">
    <title-main v-bind="titleProps" @open="$emit('open')" :text2="loading?'обновление...':''" text2Class="tone-500" :class="[open&&'margin-bottom-8px']">
      <button-sq :icon="loading?'loading rotating':'refresh'" @click="$emit('refresh')" :disabled="loading"/>
    </title-main>
  </div>`,
  props:{
    type:{type:String,required:true},
    open:{type:Boolean,default:false},
    loading:{type:Boolean,default:false},
  },
  data:()=>({
    types:[
      ['internet','eth',    'Интернет'],
      ['tv',      'tv',     'Телевидение'],//Foris
      ['analogtv','tv',     'Аналоговые ТВ'],
      ['digittv', 'tv',     'Цифровые ТВ'],
      ['iptv',    'tv',     'IPTV'],
      ['phone',   'phone-1','Телефония'],
      ['hybrid',  'tv',     'Гибридные ТВ'],
      ['mobile',  'phone',  'Мобильные'],
      ['package', 'amount', 'Пакеты'],//Foris
      ['other',   'amount', 'Другие'],
    ].reduce((types,[type,icon,text])=>({...types,[type]:{type,icon,text}}),{})
  }),
  computed:{
    titleProps(){
      const {type,types}=this;
      return types[type]?types[type]:types['other']
    }
  },
});

//add rop
Vue.component('ForisService',{
  template:`<div name="ForisService">
    <link-block v-bind="titleProps" action-icon="" type="medium"/>
    <info-subtitle :text="'MSISDN: '+service.msisdn"/>
    <info-subtitle :text="service.tariff"/>
    <account-call v-if="service.type=='mobile' && service.msisdn" :phone="service.msisdn" class="margin-bottom-16px" showSendSms/>
    <template v-if="service.type=='internet'">
      <info-subtitle v-if="service.auth_type||service.rate" :text="authAndSpeed"/>
      <ForisInternetAccessCreds :service="service" class="margin-left-16px"/>
    </template>
    <DropdownBlock icon="info" text="Скидки, услуги, сервисы" :title="{text2:service.products.length?service.products.length:'',text1Class:'font--13-500',text2Class:'font--13-500 tone-500'}">
      <template v-for="(product,i) of service.products">
        <devider-line/>
        <ForisServiceProduct :product="product" :key="i"/>
      </template>
    </DropdownBlock>
    <template v-if="smartCardsNumbers.length">
      <devider-line/>
      <DropdownBlock icon="card" text="Оборудование" :title="{text2:smartCardsNumbers.length,text1Class:'font--13-500',text2Class:'font--13-500 tone-500'}">
        <template v-for="(smartCardNumber,key) of smartCardsNumbers">
          <devider-line/>
          <IrdetoSmartCard :cardNumber="smartCardNumber" :key="key+'-'+smartCardNumber" class="margin-left-right-16px"/>
        </template>
      </DropdownBlock>
    </template>
  </div>`,
  props:{
    service:{type:Object,default:()=>({})},
  },
  computed:{
    titleProps(){
      const {type,blocks_status}=this.service;
      return {
        icon:{
          internet:'eth',
          tv:'tv',
          phone:'phone-1',
          hybrid:'tv',
          iptv:'tv',
          mobile:'phone',
          package:'amount',
        }[type]||'amount',
        text:{
          internet:'Интернет',
          tv:'Телевидение',
          phone:'Телефония',
          hybrid:'Гибридное ТВ',
          iptv:'IPTV',
          mobile:'Мобильное',
          package:'Пакет',
        }[type]||'Другое',
        text1Class:'tone-900',
        text2:blocks_status?'Отключена':'Активна',
        text2Class:blocks_status?'main-red':'main-green',
      }
    },
    authAndSpeed(){const {auth_type,rate}=this.service;return [auth_type,rate].filter(v=>v).join(' • ')},
    smartCardsNumbers(){
      const products=this.service.products.filter(({service_parameter})=>service_parameter?.find(({name,value})=>name=='Номер смарт-карты'))
      return products.map(({service_parameter})=>service_parameter.find(({name,value})=>name=='Номер смарт-карты').value).filter(Boolean)
    }
  },
});

Vue.component('IrdetoSmartCard', {
  template:`<section name="IrdetoSmartCard">
    <title-main icon="card" text="Смарт-карта" :text2="cardNumber" textClass="font--13-500" @open="open=!open" :opened="open" class="padding-unset">
      <button-sq :icon="cardInfoLoading?'loading rotating':'refresh'" @click="getCardInfo" type="medium"/>
    </title-main>
    <template v-if="open">
      <loader-bootstrap v-if="cardInfoLoading&&!cardInfo" text="поиск смарт-карты"/>
      <template v-else-if="cardInfo">
        <info-value v-if="cardStatus" label="Статус карты" :value="cardStatus" withLine class="padding-unset"/>
        <info-value v-if="cardStatus" label="Активирована" :value="cardIsActivated?'YES':'NO'" withLine class="padding-unset"/>
        <info-value label="Привязка к Chip ID" v-for="(chipid,key) of cardChipIdList" :value="chipid" :key="key" withLine class="padding-unset"/>
        <info-value label="Привязка к Chip ID" v-if="!cardChipIdList.length" value="—" withLine class="padding-unset"/>
        
        <info-text-sec title="Пакеты на карте" :text="!cardPackets?.length?'—':''" class="padding-unset"/>
        <div v-if="cardPackets.length" class="display-flex flex-wrap-wrap gap-4px margin-bottom-8px">
          <div v-for="(packet,key) of cardPackets" :key="key" class="font--13-500 tone-100 padding-left-right-2px bg-main-teal-light border-radius-2px">{{packet}}</div>
        </div>
        
        <div class="display-flex flex-direction-column gap-4px">
          <SectionBorder class="padding-4px">
            <info-text-sec title="Повторная активация с ChipID:" class="padding-unset"/>
            <selector-mini :items="cardChipIdList" @input="chip=$event" :value="chip" class="margin-bottom-4px"/>
            <button-main label="Повторная активация" @click="doSmartCardAction('recovery',{chip})" :disabled="loadingSome||!chip" :loading="loads.recovery" size="full" buttonStyle="outlined"/>
            <message-el v-if="resps.recovery" v-bind="getActionResultProps('recovery')" box class="margin-top-4px"/>
          </SectionBorder>
          <SectionBorder class="padding-4px">
            <info-text-sec title="Автопоиск каналов" class="padding-unset"/>
            <button-main label="Автопоиск каналов" @click="doSmartCardAction('rescan_all')" :disabled="loadingSome" :loading="loads.rescan_all" size="full" buttonStyle="outlined"/>
            <message-el v-if="resps.rescan_all" v-bind="getActionResultProps('rescan_all')" box class="margin-top-4px"/>
          </SectionBorder>
          <SectionBorder class="padding-4px">
            <info-text-sec title="Сброс PIN кода" class="padding-unset"/>
            <button-main label="Сброс PIN кода" @click="doSmartCardAction('reset_pincode')" :disabled="loadingSome" :loading="loads.reset_pincode" size="full" buttonStyle="outlined"/>
            <message-el v-if="resps.reset_pincode" v-bind="getActionResultProps('reset_pincode')" box class="margin-top-4px"/>
          </SectionBorder>
        </div>
      </template>
    </template>
  </section>`,
  props:{
    cardNumber:{type:[String,Number],default:''},
  },
  data:()=>({
    open:false,
    loads:{},
    resps:{},
    chip:'',
  }),
  created(){
    if(this.cardNumber){
      this.getCardInfo();
    };
  },
  watch:{
    'cardInfo'(cardInfo){
      if(cardInfo){this.open=true};
    },
    'cardChipIdList'(cardChipIdList){
      this.chip=cardChipIdList?.[0]||''
    },
  },
  computed: {
    loadingSome(){return Object.values(this.loads).some(Boolean)},
    cardInfoLoading(){return this.loads.card_info},
    cardInfo(){return this.resps.card_info},
    cardSerialNumber(){return this.cardInfo?.serial_number},
    cardStatus(){return this.cardInfo?.card_status},
    cardChipIdList(){return this.cardInfo?.pairing_info_property||[]},
    cardIsActivated(){return this.cardInfo?.activation_status},
    cardPackets(){return (this.cardInfo?.products?.positive||'').split(',').map(p=>p.trim())}
  },
  methods: {
    getActionResultProps(method=''){
      const resp=this.resps?.[method];
      if(!resp){return};
      return {
        text:resp.isError?(resp.message||'Error'):`Успешно ${resp.code||''}`,
        type:resp.isError?'warn':'success',
      }
    },
    async getCardInfo(){
      if(this.cardInfoLoading||!this.cardNumber){return}
      this.$set(this.loads,'card_info',true);
      try{
        const response=await httpGet(buildUrl('card_info',{number:this.cardNumber},'/call/irdeto/'))
        this.$set(this.resps,'card_info',response);
      }catch(error){
        console.warn('card_info.error',error);
      };
      this.$set(this.loads,'card_info',!true);
    },
    async doSmartCardAction(method='',params=null){//reset_pincode,rescan_all,recovery(chip)
      if(!method){return};
      this.$set(this.loads,method,true);
      this.$set(this.resps,method,null);
      try{
        const response=await httpGet(buildUrl(method,{number:this.cardNumber,...params},'/call/irdeto/'))
        this.$set(this.resps,method,response);
      }catch(error){
        console.warn('card_info.error',error);
      };
      this.$set(this.loads,method,!true);
    },
  },
});

