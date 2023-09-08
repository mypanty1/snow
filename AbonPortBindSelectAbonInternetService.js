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
