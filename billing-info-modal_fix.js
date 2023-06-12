//fix date and other
Vue.component('billing-info-modal', {//20410105174
  //template: "#billing-info-modal",
  template:`<modal-container-custom ref="modal" :wrapperStyle="{'min-height':'auto','margin-top':'4px'}">
    <div class="margin-bottom-16px">
      <div class="font--18-600 tone-900 text-align-center">Настройки профиля абонента</div>
      <div class="font--13-500-140 tone-500 text-align-center">Информация в биллинге</div>
    </div>
    <loader-bootstrap v-if="loading" text="получение профиля абонента"/>
    <template v-else-if="billingInfo_0_0">
      <div v-if="portNumber" class="font--15-500 margin-left-24px" style="color:#676767;">Порт {{portNumber}}</div>
      <link-block v-if="deviceIP" icon="-" @click="$router.push({name:'search',params:{text:deviceIP}})" :text="deviceIP" actionIcon="right-link" type="medium" class="padding-right-16px"/>
      <info-value v-for="(value,label,key) in profileInfo" :key="key" v-if="value" v-bind="{label,value}" type="large" withLine/>
    </template>
    <message-el v-else-if="isError" :text="message" type="warn" box class="margin-left-right-16px"/>
    <message-el v-else text="Данные отсутствуют" type="info" box class="margin-left-right-16px"/>
  </modal-container-custom>`,
  props:{
    billingInfo:{type:Array,required:true},
    loading:Boolean,
  },
  data:()=>({}),
  computed:{
    billingInfo_0_0(){
      return this.billingInfo?.[0]?.[0]
    },
    deviceIP(){return this.billingInfo_0_0?.deviceIP},
    portNumber(){return this.billingInfo_0_0?.portNumber},
    isError(){return this.billingInfo_0_0?.isError},
    message(){return this.billingInfo_0_0?.message},
    profileInfo(){
      function filterKeys(object={},dict={}){
        if(typeof dict==='string'){dict=dict.split(/[,;\n\t]/)};
        if(typeof dict!=='object'){return {}};
        function toArr(str){return Array.isArray(str)?str:str?.split?str?.split('|'):[]};
        const getParams=Array.isArray(dict)?function(value){return toArr(value)}:function(value,_key){return [_key,...toArr(value)]};
        dict=Object.entries(dict).reduce((_dict,[_key,value=''])=>{
          const [old_key,new_key,handler]=getParams(value,_key);
          _dict[old_key]=[new_key,handler];
          return _dict;
        },{});
        function getByPath(target={},path=''){for(const key of Array.isArray(path)?path:path.split('.')){if(target==null){return};target=target[key]};return target};
        const target={};
        return Object.entries(dict).reduce((result,[old_key,[new_key,handler]])=>{
          const value=getByPath(object,old_key);
          result[new_key||old_key]=typeof handler==='function'?handler(value,object):typeof handler!=='undefined'?value||handler:value;
          return result
        },{});
      };
      function formatDate(value){
        const date=new Date(value);
        return (!value||!date||date=='Invalid Date')?'':date.toLocaleString();
      };
      return filterKeys(this.billingInfo_0_0||{},{
        'rate':           ['Скорость по тарифу',(v)=>v?`${v} Мбит/c`:''],//200
        'ip.0.IP':        ['IP-адрес',(v,o)=>v?v+(o?.ip?.[0]?.Mask?`/${o?.ip?.[0]?.Mask}`:''):''],//''
        'macCPE':         ['MAC-адрес СРЕ',(v)=>v?.[0]||''],//[]
        'maxSessions':    ['Макс. кол. сессий'],//'3'
        //'portNumber':     ['Номер порта'],//'46'
        //'deviceIP':       ['IP коммутатора'],//'10.223.147.57'
        'deviceMac':      ['MAC коммутатора'],//'085A.11D8.A9F1'
        //'deviceId':       ['deviceId'],//null
        'innerVLan':      ['C-vlan'],//null
        'outerVLan':      ['S-vlan'],//null
        'accOnDateFirst': ['Дата активации',formatDate],//null
        'blockDate':      ['Дата блокировки',formatDate],//null
        'deviceSegment':  ['Сегмент оборудования',(v)=>v?v.split(","):''],//null
      })
    },
  },
  methods:{
    open(){//public
      this.$refs.modal.open();
    },
  },
});
























