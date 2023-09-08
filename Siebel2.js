
Vue.component('SiebelServiceRequest',{
  template:`<div name="SiebelServiceRequest">
    <loader-bootstrap v-if="serviceRequestLoading" text="получение сервисного запроса"/>
    <template v-else-if="serviceRequest">
      <template v-if="noDropdown">
        <div class="font--13-500 tone-500">Сервисный запрос</div>
        <SiebelServiceRequestContent v-bind="{serviceRequest}"/>
      </template>
      <DropdownBlock v-else :title="{icon:'info',text:'СЗ',text2:srNumber,text2Class:'tone-500',class:'padding-left-8px'}">
        <div class="font--13-500 tone-500">Сервисный запрос</div>
        <SiebelServiceRequestContent v-bind="{serviceRequest}"/>
      </DropdownBlock>
    </template>
    <link-block v-else :text="srNumber" type="medium" actionIcon="copy" @click="copy(srNumber)" class="padding-unset"/>
  </div>`,
  props:{
    srNumber:{type:String,required:true,default:''},
    noDropdown:{type:Boolean,default:false},
  },
  data:()=>({}),
  created(){
    this.$store.dispatch('siebel2/getServiceRequest',{srNumber:this.srNumber});
  },
  watch:{
    'srNumber'(srNumber){
      this.$store.dispatch('siebel2/getServiceRequest',{srNumber});
    }
  },
  computed:{
    serviceRequestLoading(){return this.$store.getters['siebel2/getLoad'](this.srNumber)},
    serviceRequest(){return this.$store.getters['siebel2/getServiceRequest'](this.srNumber)},
  },
  methods:{
    copy(text){
      copyToBuffer(text);
    },
  },
});
Vue.component("SiebelServiceRequestCommentsModal", {
  template:`<div name="SiebelServiceRequestCommentsModal">
    <modal-container-custom ref="modal" :footer="false" :wrapperStyle="{'min-height':'auto','margin-top':'4px'}">
      <div class="padding-left-right-16px">
        <div class="display-flex flex-direction-column gap-8px">
          <div class="font--15-600 text-align-center">Комментарии к {{srNumber}}</div>
          
          <loader-bootstrap v-if="serviceRequestCommentsLoading" text="получение комментариев"/>
          <message-el v-else-if="!serviceRequestComments?.length" text="Нет комментариев" box type="info"/>
          <div v-else class="display-flex flex-direction-column">
            <template v-for="({id,createDate,text},index) of serviceRequestComments">
              <devider-line v-if="index"/>
              <info-text-sec :title="formatDate(createDate)" :text="text" :key="id" class="padding-unset"/>
            </template>
          </div>
        </div>
        <div class="margin-top-16px display-flex justify-content-space-around">
          <button-main label="Закрыть" @click="close" buttonStyle="outlined" size="medium"/>
        </div>
      </div>
    </modal-container-custom>
  </div>`,
  props:{
    srNumber:{type:String,required:true,default:''},
  },
  data:()=>({}),
  watch:{
    'srNumber'(srNumber){
      this.$store.dispatch('siebel2/getServiceRequestComments',{srNumber});
    }
  },
  computed:{
    serviceRequestCommentsLoading(){return this.$store.getters['siebel2/getLoad'](atok(this.srNumber,'comments'))},
    serviceRequestComments(){return this.$store.getters['siebel2/getServiceRequestComments'](this.srNumber)},
  },
  methods:{
    open(links){//public
      this.$refs.modal.open();
      this.$store.dispatch('siebel2/getServiceRequestComments',{srNumber:this.srNumber});
    },
    close(){//public
      this.$refs.modal.close();
    },
    formatDate(value){
      const date=new Date(value);
      return (!value||!date||date=='Invalid Date')?'':date.toLocaleString();
    },
  },
});
Vue.component('SiebelServiceRequests',{
  template:`<div name="SiebelServiceRequests">
    <DropdownBlock :title="{icon:'info',text:title,text2:serviceRequestsFilteredCount?serviceRequestsFilteredCount:'',text2Class:'tone-500'}">
      <div class="margin-left-right-16px">
        <loader-bootstrap v-if="serviceRequestsLoading" text="получение недавних обращений"/>
        <message-el v-if="!serviceRequestsFilteredCount" text="Нет недавних обращений" box type="info"/>
        <div v-else class="display-flex flex-direction-column gap-4px">
          <template v-for="(serviceRequest,index) of serviceRequestsFiltered">
            <devider-line v-if="index"/>
            <SiebelServiceRequestContent v-bind="{serviceRequest}" :key="index"/>
          </template>
        </div>
      </div>
    </DropdownBlock>
  </div>`,
  props:{
    agreementNum:{type:String,required:true,default:''},
    srNumberCurrent:{type:String,default:''},
  },
  data:()=>({}),
  created(){
    this.$store.dispatch('siebel2/getServiceRequests',{agreementNum:this.agreementNum});
  },
  watch:{
    'agreementNum'(agreementNum){
      this.$store.dispatch('siebel2/getServiceRequests',{agreementNum});
    }
  },
  computed:{
    title(){return this.srNumberCurrent?'Другие обращения абонента':'Недавние обращения'},
    serviceRequestsFiltered(){
      const {serviceRequests,srNumberCurrent}=this;
      return srNumberCurrent?(serviceRequests||[]).filter(({number})=>number!==srNumberCurrent):serviceRequests;
    },
    serviceRequestsFilteredCount(){return this.serviceRequestsFiltered?.length||0},
    serviceRequestsLoading(){return this.$store.getters['siebel2/getLoad'](this.agreementNum)},
    serviceRequests(){return this.$store.getters['siebel2/getServiceRequests'](this.agreementNum)},
  },
  methods:{},
});

store.registerModule('siebel2',{
  namespaced:true,
  state:()=>({
    loads:{},
    serviceRequests:{},
    serviceRequestsComments:{},
  }),
  getters:{
    getKey:state=>(...attrs)=>atop('siebel',...attrs),
    getLoad:state=>(...args)=>(args.length==2)?state.loads[args[0]]?.[args[1]]:state.loads[args[0]],
    getServiceRequest:state=>(srNumber)=>state.serviceRequests[srNumber],
    getServiceRequests:state=>(value)=>Object.values(state.serviceRequests).filter(Boolean).filter(({customerIdentification:{msisdn,accountNum,agreementNum}})=>value&&[msisdn,accountNum,agreementNum].includes(value)),
    getServiceRequestComments:state=>(srNumber)=>state.serviceRequestsComments[srNumber]
  },
  mutations:{
    setLoad(state,attrs=[]){
      if(attrs?.length==3){
        const [section,key,value=false]=attrs;
        if(!state.loads[section]){Vue.set(state.loads,section,{})};
        Vue.set(state.loads[section],key,value);
      }else{
        const [section,value=false]=attrs;
        Vue.set(state.loads,section,value);
      };
    },
    setServiceRequest(state,attrs=[]){
      const [srNumber,serviceRequest=null]=attrs;
      Vue.set(state.serviceRequests,srNumber,serviceRequest);
    },
    setServiceRequestComments(state,attrs=[]){
      const [srNumber,serviceRequestComments=null]=attrs;
      Vue.set(state.serviceRequestsComments,srNumber,serviceRequestComments);
    },
  },
  actions:{
    async getServiceRequest({getters,commit},{srNumber='',params={},update=false}){
      if(!srNumber){return};
      if(!SIEBEL.isSrNumber(srNumber)){return};
      const method='siebel_sr_service_request';
      const cacheKey=getters.getKey(srNumber);
      const cache=localStorageCache.getItem(cacheKey);
      if(cache&&!update){
        commit('setServiceRequest',[srNumber,cache]);
        return getters.getServiceRequest(srNumber);
      };
      if(getters.getLoad(srNumber)){return};
      commit('setLoad',[srNumber,true]);
      commit('setServiceRequest',[srNumber,null]);
      try{
        const query=objectToQuery({'serviceRequest.number':srNumber,...params});
        const response=await httpGet(buildUrl(method,query,'/call/v1/siebel/'));
        if(response?.id){
          localStorageCache.setItem(cacheKey,response);
          commit('setServiceRequest',[srNumber,response]);
        }
      }catch(error){
        console.warn(`${method}.error`,error);
      };
      commit('setLoad',[srNumber,!true]);
      return getters.getServiceRequest(srNumber);
    },
    async getServiceRequestComments({getters,commit},{srNumber='',params={},update=false}){
      if(!srNumber){return};
      if(!SIEBEL.isSrNumber(srNumber)){return};
      const method='service_request_comments';
      const cacheKey=getters.getKey(srNumber,'comments');
      const cache=localStorageCache.getItem(cacheKey);
      if(cache&&!update){
        commit('setServiceRequestComments',[srNumber,cache]);
        return getters.getServiceRequestComments(srNumber);
      };
      const loadKey=atok(srNumber,'comments');
      if(getters.getLoad(loadKey)){return};
      commit('setLoad',[loadKey,true]);
      commit('setServiceRequestComments',[srNumber,null]);
      try{
        const query=objectToQuery({id:srNumber,...params});
        const response=await httpGet(buildUrl(method,query,'/call/v1/siebel/'));
        if(Array.isArray(response)){
          localStorageCache.setItem(cacheKey,response);
          commit('setServiceRequestComments',[srNumber,response]);
        }else{
          localStorageCache.setItem(cacheKey,[]);
          commit('setServiceRequestComments',[srNumber,[]]);
        }
      }catch(error){
        console.warn(`${method}.error`,error);
      };
      commit('setLoad',[loadKey,!true]);
      return getters.getServiceRequestComments(srNumber);
    },
    async getServiceRequests({getters,commit},{agreementNum='',params={},update=false}){
      if(!agreementNum){return};
      const _agreementNum=SIEBEL.toAgreementNum(agreementNum)||agreementNum;
      const startDate=new Date(new Date().setDate(-1)).toISOString().replace(/.\d\d\dZ$/,'Z');
      const endDate=new Date().toISOString().replace(/.\d\d\dZ$/,'Z');
      const method='siebel_sr_service_requests';
      const cacheKey=getters.getKey(_agreementNum,'service_requests');
      const cache=localStorageCache.getItem(cacheKey);
      if(cache&&!update){
        for(const serviceRequest of cache){
          commit('setServiceRequest',[serviceRequest.number,serviceRequest]);
        };
        return cache;
      };
      if(getters.getLoad(_agreementNum)){return};
      commit('setLoad',[_agreementNum,true]);
      try{
        const responses=await Promise.allSettled([...new Set([agreementNum,_agreementNum])].filter(v=>v).map(agreementNum=>{
          return httpGet(buildUrl(method,{'customerIdentification.agreementNum':agreementNum,startDate,endDate},'/call/v1/siebel/'))
        }));
        const response=responses.reduce((responses,response)=>[...responses,...Array.isArray(response.value)?response.value:[]],[]);
        if(Array.isArray(response)){
          for(const serviceRequest of response){
            commit('setServiceRequest',[serviceRequest.number,serviceRequest]);
          };
          localStorageCache.setItem(cacheKey,response);
        }else{
          localStorageCache.setItem(cacheKey,[]);
        };
      }catch(error){
        console.warn(`${method}.error`,error);
      };
      commit('setLoad',[_agreementNum,!true]);
      return getters.getServiceRequests(_agreementNum);
    },
  }
});
