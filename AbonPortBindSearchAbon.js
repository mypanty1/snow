//fix input list option value
// Vue.component('input-el', {
//   template:`<section class="input-el" :class="sectionClass">
//     <label class="input-el__label">
//       <slot v-if="focus||value" name="prefix"></slot>
//       <div class="input-el__input-wrapper">
//         <datalist :id="datalistId">
//           <template v-for="(item,key) of items">
//             <template v-if="Array.isArray(item)">
//               <option :key="key" :label="item[0]" :value="item[1]"></option>
//             </template>
//             <template v-else-if="item?.label||item?.value">
//               <option :key="key" :label="item.label" :value="item.value"></option>
//             </template>
//             <template v-else>
//               <option :key="key">{{item}}</option>
//             </template>
//           </template>
//         </datalist>
//         <input class="input-el__input" :class="inputElClass" v-bind="{value,disabled:disabledOrReadOnly,type,placeholder:focus?placeholder:label,list:datalistId,...$attrs,...inputAttrs}" v-filter="filter" :style="{'background-color':disabled?'#f1f1f1':''}" @focus="focus=true" @blur="focus=false" @input="$emit('input',$event.target.value)"  @keyup.enter="$emit('onKeyUpEnter')">
//       </div>
//       <span v-show="showLabel && (focus || value)" class="input-el__label-text" :style="{'background-color':disabled?'#f1f1f1':''}">{{label}}</span>
//       <slot name="postfix"></slot>
//       <div class="input-el__clear" v-show="clearable&&value" @click.stop="clear">
//         <span class="fas fa-times"></span>
//       </div>
//       <slot name="postfix2"></slot>
//     </label>
//   </section>`,
//   props: {
//     value: { type: [String, Number], default: '' },
//     label: { type: String, default: '' },
//     showLabel: { type: Boolean, default: true },
//     type: { type: String },
//     error: { type: Boolean, default: false },
//     maxLength: { type: Number, default: null },
//     clearable: { type: Boolean, default: false },
//     disabled: { type: Boolean, default: false },
//     readOnly: { type: Boolean, default: false },
//     placeholder: { type: String, default: '' },
//     items:{type:Array,default:()=>[]},
//     filter: { type: String, default: '' },
//     inputClass: { type: [String,Array], default: '' },
//     inputAttrs: { type: Object, default: null },
//   },
//   data: () => ({
//     focus: false,
//     datalistId:null
//   }),
//   created(){
//     this.datalistId=randcode(20);
//   },
//   computed: {
//     disabledOrReadOnly(){return this.disabled||this.readOnly},
//     sectionClass() {
//       return {
//         'input-el--focus': this.focus,
//         'input-el--filled': this.value,
//         'input-el--error': this.error,
//         'input-el--disabled': this.disabled,
//       };
//     },
//     inputElClass() {
//       return [
//         !!this.$slots.prefix&&'input-el__input--prefix',
//         !!this.$slots.postfix&&'input-el__input--postfix',
//         this.inputClass
//       ];
//     },
//   },
//   methods: {
//     clear() {
//       if (this.disabled) return;
//       this.$emit('input', '');
//     },
//   },
// });

Vue.component('AbonPortBindSearchAbon',{
  template:`<div>
    <div class="display-flex flex-direction-column gap-8px">
      <div class="position-relative">
        <input-el label="ЛС" placeholder="ЛС" v-model="account" clearable @onKeyUpEnter="onChange" class="padding-unset">
          <template slot="postfix2">
            <button-sq :icon="!openItemsList?'down':'up'" @click="openItemsList=!openItemsList"/>
            <button-sq icon="search" @click="onChange"/>
          </template>
        </input-el>
        <div v-if="openItemsList" class="position-absolute white-block-100 border-solid-1px-c8c7c7 border-radius-4px" style="top:52px;z-index:2;opacity:0.9;max-height:50vh;overflow-y:auto;">
          <radio-select-el :list="tasksItemsList" keyName="taskId" keyLabel="account" keyLabel3="descr" @selected="onSelect" reverse/>
        </div>
      </div>
      
      <loader-bootstrap v-if="abonDataLoading" :text="loaderText"/>
      <message-el v-else-if="abonDataErrorText" :text="abonDataErrorText" box type="warn"/>
      <AbonPortBindSelectAbonInternetService v-else-if="agreement" v-bind="{abonData,agreement,vgroups}" v-model="vg" @onVgUnblock="updateVg"/>
    </div>
  </div>`,
  data:()=>({
    openItemsList:!1,
    account:'',
    abonDataLoading:!1,
    abonDataErrorText:null,
    abonData:null,
    agreement:null,
    vgroups:[],
    vg:null,
  }),
  watch:{
    'account'(account,_account){
      if(!account/*||_account*/){
        this.clear();
      };
    },
    'agreement'(agreement){
      this.$emit('onAccountFind',agreement?.account||'');
    },
    'vg'(vg){
      this.$emit('onVgSelect',vg||null);
    },
    'mrId'(mrId){
      this.$emit('onMrId',mrId||0);
    }
  },
  computed:{
    ...mapGetters({
      tasks:'wfm/tasks',
    }),
    agreementNum(){return SIEBEL.toAgreementNum(this.account)},
    loaderText(){return `поиск абонента "${this.agreementNum}"`},
    mrId(){return this.abonData?.mr_id},
    tasksItemsList(){
      return this.tasks.reduce((list,{AddressSiebel,NumberOrder,clientNumber,Assignment,status})=>{
        if(!WFM.isValidAccount(clientNumber)){return list};
        const flat=((AddressSiebel||'').split(', кв. ')[1]||'?'); 
        list.push({
          taskId:NumberOrder,
          account:clientNumber,
          descr:`${Assignment} • ${status} • ${(flat.includes('кв')?flat:'кв '+flat)}`,
        })
        return list;
      },[]);
    },
  },
  methods:{
    clear(){
      //this.account='';
      this.abonDataLoading=!1;
      this.abonDataErrorText='';
      this.abonData=null;
      this.agreement=null;
      this.vgroups=[];
      this.vg=null;
    },
    toListItem({AddressSiebel,Assignment,status,clientNumber}={}){
      const flat=((AddressSiebel||'').split(', кв. ')[1]||'?'); 
      return {label:`${Assignment} • ${status} • ${(flat.includes('кв')?flat:'кв '+flat)}`,value:clientNumber};
    },
    onSelect(item){
      this.account=item?.account;
      this.onChange();
    },
    onChange(){
      this.openItemsList=!1;
      this.searchAbonAgreementInternetServices();
    },
    async searchAbonAgreementInternetServices(update=false){
      const {abonDataLoading,agreementNum}=this;
      if(!agreementNum){return};
      if(abonDataLoading){return};
      this.abonDataLoading=!0;
      this.abonData=null;
      this.abonDataErrorText='';
      this.agreement=null;
      this.vgroups=[];
      this.vg=null;
      const key=atok('account',agreementNum);
      try{
        //const cache=!update?this.$cache.getItem(key):null;
        //const response=cache||await httpGet(buildUrl("search_ma",{pattern:agreementNum},"/call/v1/search/"));
        const response=await httpGet(buildUrl("search_ma",{pattern:agreementNum},"/call/v1/search/"));
        if(response?.data){
          //this.$cache.setItem(key,response);
          if(response?.data?.lbsv){
            this.abonData=(response.data.lbsv?.type==='single'?[response.data.lbsv.data]:response.data.lbsv.data).find(lbsvData=>{
              return Boolean(this.agreement=lbsvData.agreements.find(item=>SIEBEL.toAgreementNum(item.account)==agreementNum));
            });
            if(!this.agreement||!this.abonData){
              this.abonDataErrorText='ЛС не найден в agreements';
            }else if(this.agreement){
              const {agreement}=this;
              this.vgroups=(this.abonData?.vgroups||[])?.filter(({isSession,agrmid})=>isSession&&agrmid==agreement.agrmid).sort(({vgid:a},{vgid:b})=>b-a).sort(({accondate:a},{accondate:b})=>{
                const aDateOn=(a||a!=="0000-00-00 00:00:00")?new Date(Date.parse(a)):0;
                const bDateOn=(b||b!=="0000-00-00 00:00:00")?new Date(Date.parse(b)):0;
                return bDateOn-aDateOn
              });
            };
          }else{
            this.abonDataErrorText='ЛС не найден в Lbsv';
          };
        }else{
          this.abonDataErrorText='ЛС не найден';
        };
      }catch(error){
        console.warn("search_ma.error",error);
        this.abonDataErrorText='Ошибка сервиса';
      };
      this.abonDataLoading=!1;
    },
    async updateVg({serverid,vgid}={}){
      if(!serverid||!vgid){return};
      const {vgroups}=this;
      try{
        const response=await httpGet(buildUrl("resource_info",{serverid,vgid,lbsv_data_up:'',add_status_props:''},"/call/lbsv/"));
        if(!response?.vgid){return};
        const currentVg=vgroups.find(vg=>vg.vgid==vgid);
        if(!currentVg){return};
        const currentVgIndex=vgroups.findIndex(vg=>vg.vgid==vgid);
        this.$set(this.vgroups,currentVgIndex,{
          ...currentVg,
          ...response
        });
      }catch(error){
        console.warn("resource_info.error",error);
      }
    }
  },
});
