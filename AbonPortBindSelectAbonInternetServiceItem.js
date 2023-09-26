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
      if(this.activateIsOk){
        this.$emit('onVgUnblock',this.vg.vgid)
      }
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

