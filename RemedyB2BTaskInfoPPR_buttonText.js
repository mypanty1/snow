Vue.component('RemedyB2BTaskInfoPPR',{
  template:`<div class="display-flex flex-direction-column gap-8px">
    <div class="white-block-100 padding-8px">
      <div class="display-flex align-items-center justify-content-space-between gap-4px">
        <div class="display-flex align-items-center gap-4px">
          <IcIcon name="connection" color="#918f8f"/>
          <div class="font--15-600">Сведения</div>
        </div>
        <div class="font--13-500 tone-500">{{taskTimeRangeText}}</div>
      </div>
      <devider-line/>
      <link-block :text="taskId" @click="copy(taskId)" actionIcon="copy" type="medium" class="padding-unset"/>
      <devider-line/>
      <title-main icon="focused tone-900" :text="declaredfault" textClass="font--13-500 tone-500" class="padding-unset margin-top-bottom--8px"/>
      <title-main icon="in-work tone-500" :text="taskStatus" textClass="font--13-500 tone-500" class="padding-unset margin-top-bottom--8px"/>
      <title-main :text="taskPersName2" :textSub="taskGroupName" textClass="font--13-500 tone-500" textSubClass="font--13-500 tone-500" class="padding-unset margin-top-bottom--8px"/>
    </div>

    <div v-if="neName" class="white-block-100 padding-8px">
      <loader-bootstrap v-if="deviceLoading" text="поиск СЭ"/>
      <device-info v-if="device" :networkElement="device" hideEntrances showLocation showType addBorder autoSysInfo/>
      <link-block v-else icon="amount" :text="neName" actionIcon="right-link" type="medium" class="padding-unset"/>
    </div>
    <div v-else-if="siteName" class="white-block-100 padding-8px">
      <link-block icon="amount" :text="siteName" actionIcon="right-link" type="medium" class="padding-unset"/>
    </div>

    <div class="white-block-100 padding-8px bg-attention-warning">
      <info-value label="Начало" :value="planstartText" withLine class="padding-unset"/>
      <info-value label="Длительность" :value="deadlineText" withLine class="padding-unset"/>
      <info-value label="SLA до" :value="sladataText" withLine class="padding-unset"/>

      <info-text-sec title="Описание объекта сети" :text="ne" class="padding-unset"/>
      <info-text-sec title="Доп. информация" :text="shortdescription" class="padding-unset"/>
      
      <template v-if="taskPersName2||persdata2">
        <devider-line/>
        <info-text-sec v-if="taskPersName2" title="Исполнитель" :text="taskPersName2" class="padding-unset"/>
        <PhoneCall v-if="persdata2_phones" :phone="persdata2_phones" :descr="taskPersName2" showSendSms/>
        <info-text-sec :text="persdata2" class="padding-unset"/>
      </template>
    </div>

    <div class="white-block-100 padding-8px display-flex flex-direction-column gap-8px">
      <button-main :label="buttonText" @click="$refs.ChangeRemedyB2BTaskStatusModal.open()" buttonStyle="contained" size="full"/>
      <button-main label="Переназначить наряд" @click="$refs.ChangeRemedyB2BTaskExecutorModal.open()" buttonStyle="outlined" size="full"/>
    </div>
    <ChangeRemedyB2BTaskStatusModal ref="ChangeRemedyB2BTaskStatusModal"/>
    <ChangeRemedyB2BTaskExecutorModal ref="ChangeRemedyB2BTaskExecutorModal"/>
  </div>`,
  props:{
    taskId:{type:String,required:true},
    isActiveTab:{type:Boolean,default:false},
  },
  data:()=>({
    scrollTimeout:null,
    loading:false,
    deviceLoading:false,
    device:null,
  }),
  created(){
    if(this.isActiveTab&&!this.loading){
      this.onActiveTabScrollEnd();
    };
  },
  watch:{
    'isActiveTab'(isActiveTab){
      if(isActiveTab&&!this.loading){
        /*this.scrollTimeout=setTimeout(()=>*/this.onActiveTabScrollEnd()/*,TASK.TABS_SCROLL_TIMEOUT);*/
      }else{
        clearTimeout(this.scrollTimeout);
      };
    },
  },
  computed:{
    ...mapGetters({
      task:'remedy_b2b/task',
      taskStatus:'remedy_b2b/taskStatus',
      taskGroupName:'remedy_b2b/taskGroupName',
      taskPersName2:'remedy_b2b/taskPersName2',
    }),
    taskData(){return this.task?.taskData||{}},

    declaredfault(){return this.taskData.declaredfault||''},
    shortdescription(){return this.taskData.shortdescription||''},
    
    persdata2(){return this.task.persdata2},
    persdata2_phones(){return this.task.persdata2_phones||''},
    
    ne(){return this.taskData.ne||''},
    
    taskTimeRangeText(){
      const {deadline,sladata,planstart}=this.taskData;
      const startSec=parseInt(planstart)||0;
      const endSec=parseInt(deadline||sladata)||0;
      const start=startSec?DATE.getDate_DDMMYYYY(startSec*1000):'';
      const end=endSec?DATE.getDate_DDMMYYYY(endSec*1000):'';
      return [start,end].filter(Boolean).join(' - ') 
    },
    deadlineText(){return DATE.getDateTime_DDMMYYYYHHmm((parseInt(this.taskData.deadline)||0)*1000)},
    sladataText(){return DATE.getDateTime_DDMMYYYYHHmm((parseInt(this.taskData.sladata)||0)*1000)},
    planstartText(){return DATE.getDateTime_DDMMYYYYHHmm((parseInt(this.taskData.planstart)||0)*1000)},

    neName(){return this.task.neName},
    siteName(){return this.task.siteName},

    buttonText(){return this.taskStatus==REMEDY.WORK_STATUS_004?'Завершить работу':'Взять в работу'},
  },
  methods:{
    async onActiveTabScrollEnd(){
      this.loading=true;
      this.getDevice();
      this.$store.dispatch('remedy/getTaskComments',{taskId:this.taskId});
      this.loading=false;
    },
    copy(text){
      copyToBuffer(text);
    },
    async getDevice(){
      const {neName}=this;
      if(!neName){return};
      this.deviceLoading=!0;
      const method='get_devices_by_name';
      const key=atok(method,neName);
      let response=this.$cache.getItem(key);
      if(Array.isArray(response)&&response[0]){
        this.device=response[0];
      }else{
        try{
          response=await httpGet(buildUrl(method,{name:neName,transliterate:'en'},"/call/v1/device/"));
          if(Array.isArray(response)&&response[0]){
            this.device=response[0];
            this.$cache.setItem(key,response);
          };
        }catch(error){
          console.warn(`${method}.error`,error);
        }
      }
      this.deviceLoading=!1;
    },
  },
  beforeDestroy(){
    clearTimeout(this.scrollTimeout);
  }
});
