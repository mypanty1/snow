//Sri out of agreement
Vue.component("LbsvAccountMain", {
  template:`<CardBlock name="LbsvAccountMain" v-if="account">
    <title-main>
      <div slot="prefix">
        <span class="ic-20 ic-status" :class="!agreement.closedon?'main-green':'main-red'"></span>
      </div>
      <span slot="text" class="display-flex align-items-center gap-5px">
        <span>{{accountId}}</span>
        <span v-if="agreement?.closedon" class="font--12-400 tone-500">расторгнут {{agreement.closedon}}</span>
        <span v-if="!!msisdn&&!agreement?.closedon" class="lbsv-account__convergent">Конвергент</span>
      </span>
    </title-main>
    <devider-line/>
    <info-text-icon icon="" :text="formatedAddress" type="medium"/>
    <devider-line/>
    <title-main icon="person" :text="account.name" textClass="text-transform-capitalize"/>
    <div v-if="agreement && phone === msisdn">
      <account-call v-if="!!msisdn" :phone="msisdn" :isConvergent="!!msisdn" class="margin-bottom-16px" showSendSms/>
    </div>
    <div v-else>
      <account-call v-if="!!msisdn" :phone="msisdn" :isConvergent="!!msisdn" class="margin-bottom-16px" showSendSms/>
      <account-call v-if="phone" :phone="phone" class="margin-bottom-16px" showSendSms/>
    </div>

    <devider-line v-if="agreement"/>
    <template v-if="agreement">
      <info-value icon="purse" :label="balanceLabel" :value="balance" :minus="agreement.balance.minus" type="extra"/>
      <info-value icon="purse" v-if="msisdn && convergentBalance" :label="balanceLabelConvergent" :value="convergentBalance+' ₽'" :minus="convergentBalance < 0" type="extra"/>
      <info-value icon="clock" v-if="agreement.lastpaydate" label="Платеж" :value="lastPayText" type="extra"/>
    </template>
    <devider-line/>
      
    <link-block icon="sms" text="Смс с новым паролем" @block-click="openSendSmsModal" action-icon="expand"/>
    <send-sms-modal ref="sendSms" :account="accountId"/>
  </CardBlock>`,
  props:{
    account:{type:Object,default:null},
    agreement:{type:Object,default:null},
    flatData:{type:Object,default:null},
    loading:{type:Object,required:true},
    billingInfo:{type:Array,default:()=>[]},
    //convergentBalance:{type:[String,Number],default:null},
    accountId:{type:String,default:''},
    flat:{type:Object,default:null}
  },
  data:()=>({
    msisdn:'',
    convergentBalance:null,
  }),
  created(){
    this.getConvergent();
  },
  computed: {
    addr_type2(){//0-прописки, 1-проживания, 2-доставки счетов
      if(!this.account?.vgroups?.[0]||!this.agreement){return ""};
      const addresses=this.account.vgroups.find(service=>service.agrmid==this.agreement.agrmid&&service.addresses.find(address=>address?.type==2))?.addresses||[];
      const addr_type2=addresses?.find(address=>address?.type==2)?.address;
      return addr_type2||''
    },
    computedAddress() {
      if (!this.account) return "";
      if (this.agreement) {
        const service = this.account.vgroups.find((s) => s.agrmid == this.agreement.agrmid && s.connaddress);
        if (service) return service.vgaddress || service.connaddress;
      }
      let address = {};
      if (Array.isArray(this.account.addresses)) {
        address = this.account.addresses.find((a) => a.address) || {};
      }
      return this.account.address || address.address || "";
    },
    formatedAddress(){
      const address=this.addr_type2||this.computedAddress;
      if(!address){return ''};
      return address.split(',').map(elem=>elem.trim()).filter(v=>v).join(", ")
    },
    balance(){
      const {balance}=this.agreement;
      return `${balance.minus?'-':''}${balance.integer}.${balance.fraction} ₽`;
    },
    lastPayText(){
      const lastsum=this.agreement.lastsum||'';
      const lastpaydate=this.agreement.lastpaydate||'';
      return `${lastsum} ${lastsum?'₽':''} ${lastpaydate?'•':''} ${lastpaydate}`;
    },
    phone(){return this.account.mobile||this.account.phone},
    balanceLabel(){return `Баланс (ЛС ${this.accountId})`},
    balanceLabelConvergent(){return `Баланс (+${this.msisdn})`},
  },
  methods: {
    openSendSmsModal() {
      this.$refs.sendSms.open();
    },
    async getConvergent(){
      await this.getMsisdn();
      if(this.msisdn){
        this.getConvergentBalance();
      };
    },
    async getMsisdn(){
      const {agreement:{account}={}}=this;
      if(!account){return};
      try{
        const response=await httpGet(buildUrl("get_user_phone",{agrm_num:account},"/call/sri/"));
        this.msisdn = response?.return?.indexOf('not found') === -1 ? response.return : '';
      }catch(error){
        console.warn("get_user_phone.error",error);
      };
    },
    async getConvergentBalance(){
      const {msisdn}=this;
      if(!msisdn){return};
      try{
        const response=await httpGet(buildUrl("convergent",{msisdn},"/call/v1/foris/"));
        this.convergentBalance=response.balance;
      }catch (error){
        console.warn("convergent.error",error);
      };
    },
  },
});
