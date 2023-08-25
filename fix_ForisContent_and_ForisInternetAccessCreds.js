//fix b2b creds from get_login
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
    
    <ForisResources v-if="selected?.name=='Услуги'" :account="account" :resources="resources" :loading="loads.getForisAccountResources" :accessPoint="resps.getAccountAccessPoint" :accessPointLoading="loads.getAccountAccessPoint"/>
    <ForisPackages v-else-if="selected?.name=='Пакеты'" :account="account" :packages="packages"/>
    <ForisServices v-else-if="selected?.name=='Список'" :account="account" :services="services"/>
    
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

//show b2b creds if no product creds
Vue.component('ForisInternetAccessCreds',{
  template:`<div name="ForisInternetAccessCreds">
    <div class="font--13-500">
      <span class="tone-500">Логин • </span><span>{{creds?.login||'Нет логина'}}</span>
    </div>
    <div class="width-75-100 margin-top-8px">
      <button-main @click="show=!show" v-bind="btnProps" button-style="outlined" size="full"/>
    </div>
  </div>`,
  props:{
    service:{type:Object,default:()=>({})},
  },
  data:()=>({
    show: false,
  }),
  computed:{
    creds(){
      const {products=[],login}=this.service;
      const product=products.find(({name,service_parameter})=>/Интернет/i.test(name)&&(service_parameter||[]).find(({name})=>name=="Пароль"));
      const Creds=class {
        constructor(product_service_parameter=[]){
          this.login=product_service_parameter.find(({name})=>name=="Login")?.value||''
          this.password=product_service_parameter.find(({name})=>name=="Пароль")?.value||''
          console.log(this)
        }
      };
      const SerPar=class {
        constructor(name,value){
          this.name=name||''
          this.value=value||''
        }
      };
      return new Creds(product?.service_parameter||[new SerPar("Login",login?.login),new SerPar("Пароль",login?.password)]);
    },
    btnProps(){
      const {show,creds}=this;
      return {
        class:[show&&'password'],
        icon:!show?'unlock':'',
        label:show?creds?.password:'Показать пароль',
      }
    }
  },
});

//fix loader text
Vue.component("account-header", {
  template:`<CardBlock"v-if="loading.flat || flat">
    <loader-bootstrap v-if="loading.flat" height="38" text="поиск других договоров по адресу"/>
    <template v-if="flat">
      <nav class="nav-slider" >
        <div v-for="item of navItems" :key="item.name" class="nav-slider__item">
          <router-link :to="item.to" class="nav-slider__link" :class="item.class">
            <i :class="'ic-20 ic-'+item.icon"></i>
            <span>{{ item.title }}</span>
            <account-flat-services v-if="item.to.name!=='account-flat'" :client="item.client"/>
          </router-link>
        </div>
      </nav>
      <devider-line/>

      <title-main icon="info" text="Расположение и информация" @block-click="showLocation = !showLocation" :opened="showLocation" />
      <collapse-slide :opened="showLocation">
        <link-block icon="entrance" :text="'Подъезд № '+flat.entrance.number" :search="entranceSearch" actionIcon="right-link" type="medium"/>
      </collapse-slide>
    </template>
  </CardBlock>`,
  props: {
    flat: { type: Object, default: null },
    loading: { type: Object, required: true },
    accountId: { type: String, default: '' },
  },
  data: () => ({
    showLocation: false,
  }),
  computed: {
    navItems() {
      const navItems = [];
      if (this.loading.flat || !this.flat) return navItems;
      if (this.flat.number) navItems.push(this.navFlat);
      if (this.flat.subscribers) navItems.push(...this.navAccounts);
      return navItems;
    },
    navFlat() {
      if (!this.flat) return null;
      return {
        icon: "entrance-mini",
        title: `Кв. ${this.flat.number}`,
        to: {
          name: "account-flat",
          params: {
            accountId: this.accountId,
          }
        },
      };
    },
    navAccounts() {
      const items = [];
      this.flat.subscribers.forEach((client) => {
        const clear = x => x.replace(/-/g, "");
        const routeId = this.accountId;
        const matchedId = clear(client.account) === clear(routeId);
        const accountId = matchedId ? routeId : client.account;
        const notFlat = this.$route.name !== 'account-flat';
        items.push({
          icon: "ls",
          title: "..." + clear(accountId).slice(-6),
          client,
          class: (notFlat && matchedId) ? 'router-link-exact-active router-link-active' : '',
          to: {
            name: "account-proxy",
            params: { accountId },
          },
        });
      });
      return items;
    },
    entranceSearch() {
      return `entrance/${this.flat.entrance.id}`;
    },
  },
});




