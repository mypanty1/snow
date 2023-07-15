Vue.component('ForisServiceProduct',{
  template:`<div name="ForisServiceProduct" class="display-contents">
    <info-text-sec :title="product.code" :title2="product.name" :rows="rows"/>
  </div>`,
  props:{
    product:{type:Object,default:()=>({})},
  },
  computed:{
    rows(){
      return (this.product?.service_parameter||[]).map(({name,value})=>`${name}: ${value}`)
    }
  }
});

Vue.component('ForisService',{
  template:`<div name="ForisService">
    <link-block v-bind="titleProps" action-icon="" type="medium"/>
    <info-subtitle :text="service.tariff"/>
    <template v-if="service.type=='internet'">
      <info-subtitle v-if="service.auth_type||service.rate" :text="authAndSpeed"/>
      <foris-login-pass class="margin-left-16px" :login-password="service.login" />
    </template>
    <DropdownBlock icon="info" text="Скидки и сервисы" :title="{text2:service.products.length?('('+service.products.length+')'):'',text1Class:'font--13-500',text2Class:'font--13-500 tone-500'}">
      <template v-for="(product,i) of service.products">
        <devider-line/>
        <ForisServiceProduct :product="product" :key="i"/>
      </template>
    </DropdownBlock>
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
          hybrid:'ИТВ',
          iptv:'IPTV',
          mobile:'Мобильная связь',
          package:'Пакет',
        }[type]||'Другое',
        text1Class:'tone-900',
        text2:blocks_status?'Отключена':'Активна',
        text2Class:blocks_status?'main-red':'main-green',
      }
    },
    authAndSpeed(){const {auth_type,rate}=this.service;return [auth_type,rate].filter(v=>v).join(' • ')}
  },
});

Vue.component('ForisServices', {
  template:`<CardBlock name="ForisServices">
    <!--<title-main text="Услуги и оборудование"/>-->
    <template v-for="(service,i) of services">
      <devider-line v-if="i"/>
      <ForisService :service="service" :key="service.id"/>
    </template>
  </CardBlock>`,
  props:{
    services:Array,
  },
});

Vue.component('ForisResources', {
  template:`<section name="ForisResources">
    <loader-bootstrap v-if="loading" text="получение данных по услугам"/>
    <CardBlock v-for="(services, key) in resources" :key="key" v-if="services.length" class="mini-card margin-top-0">
      <services-header @open="$set(opened,key,!opened[key])" :open="opened[key]" :type="key"/>
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
        <equipment v-for="equipement of (equipements[key]||[])" :key="equipement.id" :mr_id="accessPoint?.region?.mr_id" :equipment="equipement" :account="account.personal_account_number" />
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

Vue.component('ForisContent',{//254704317703,254704348007
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
      
      <account-call v-if="!phoneIsVirtual" :isConvergent="account.msisdn" :phone="account.msisdn" class="margin-bottom-16px" showSendSms/>
      <account-call v-if="contactPhone && account.msisdn != contactPhone" :phone="contactPhone" class="margin-bottom-16px" showSendSms/>
      
      <devider-line />
      <info-value icon="purse" :value="balance" type="extra" label="Баланс"/>
      <info-value icon="clock" :value="lastPayment" type="extra" label="Платеж" />
      <!--
      <link-block @block-click="$refs.billingInfoModal.open()" text="Информация в биллинге" icon="server" action-icon="expand" />
      <billing-info-modal ref="billingInfoModal" :billing-info="billingInfo" :loading="loads.getForisAccountResources" />
      -->
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
    
    <ForisResources :account="account" :resources="resources" :loading="loads.getForisAccountResources" :accessPoint="resps.getAccountAccessPoint" :accessPointLoading="loads.getAccountAccessPoint"/>
    
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
    billingInfo: [],
  }),
  created(){
    this.getForisAccountPayment();
    this.getForisAccountBlockHistory();
    this.getForisAccountContacts();
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
            //this.getLoginPass(response);
            //this.getAuthAndSpeed(response);
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
              this.$set(this.resources.internet[index],'login',response.data[0]);
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
              this.$set(this.resources.internet[index],'auth_type',response.data[0].auth_type);
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
              this.$set(this.resources.internet[index],'rate',`${response.data[0].rate} Мбит/c`);
              this.billingInfo.push(response.data);
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
//
