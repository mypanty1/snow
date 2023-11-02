Vue.component('ChangeRemedyB2BTaskExecutorModal',{
  template:`<div class="display-contents">
    <modal-container-custom ref="modal" :disabled="setTaskLoading" header :footer="false" @open="onOpen" @close="onClose" :wrapperStyle="{'min-height':'auto','margin-top':'4px'}">
      <div class="padding-left-right-16px display-flex flex-direction-column gap-16px">

          <template v-if="changeStatus">
            <icon-80 class="margin-auto" v-bind="iconProps"/>
            <loader-bootstrap v-if="setTaskLoading" text="взаимодействие с Remedy"/>
          </template>
          <template v-else>
            <div class="text-align-center">
              <span class="font--13-500">Переназначить наряд <span class="main-orange">{{taskId}}</span> ?</span>
            </div>
          </template>

          <div class="display-flex flex-direction-column gap-8px">

            <UIMultiLevelSelector label="Рабочая группа" v-model="executorGroupName" :items="executorGroups" labelKey="partName" idKey="groupName" :disabled="setTaskLoading"/>
            <textarea-el label="Комментарий" v-model="text" :disabled="setTaskLoading" rows="3" class="padding-unset"/>
            <button-main v-if="changeStatus!=='success'" label="Переназначить" @click="addTaskComment" :disabled="setTaskLoading||!isValid" :loading="setTaskLoading" buttonStyle="contained" size="full"/>
          
          </div>

          <div class="display-flex justify-content-space-around">
            <button-main label="Закрыть" @click="close" :disabled="setTaskLoading" buttonStyle="outlined" size="medium"/>
          </div>

        </div>
    </modal-container-custom>
  </div>`,
  data:()=>({
    text:'',
    executorGroupName:null,
  }),
  watch:{
    'taskId'(taskId){
      if(taskId){
        this.clear();
        this.close();
      }
    },
  },
  computed:{
    ...mapGetters(['userLogin','userWorkGroupB2BName']),
    ...mapGetters({
      taskId:'remedy_b2b/taskId',
      task:'remedy_b2b/task',
      taskStatus:'remedy_b2b/taskStatus',
      setTaskLoading:'remedy/setTaskLoading',
      setTaskResult:'remedy/setTaskResult',
      regionGroupsNames:'remedy/regionGroupsNames',
      getGroupByName:'remedy/getGroupByName',
    }),
    changeStatus(){
      return this.setTaskLoading?'loading':this.setTaskResult?'success':''
    },
    iconProps(){
      switch(this.changeStatus){
        case 'loading':return {icon:'loading rotating',bgColor:'bg-main-lilac-light',icColor:'main-lilac'};
        case 'error':return {icon:'warning',bgColor:'bg-attention-warning',icColor:'main-orange'};
        case 'success':return {icon:'checkmark',bgColor:'bg-attention-success',icColor:'main-green'};
      };
    },
    executorGroups(){
      return REMEDY.workGroupsNamesListToUIMultiLevelSelectorItems([...new Set([
        this.userWorkGroupB2BName,
        ...this.regionGroupsNames
      ])].filter(Boolean));
    },
    needLogin(){return !REMEDY.B2B_TASK_WORK_STATUSES_REASSIGN_NO_LOGIN.includes(this.taskStatus)},
    executorLogin(){return this.needLogin?this.userLogin:''},
    executorGroupId(){return this.getGroupByName(this.executorGroupName)?.groupID},
    isValid(){return Boolean(this.text)&&this.executorGroupId&&(this.needLogin?this.executorLogin:!0)},
  },
  methods:{
    open(){//public
      this.$refs.modal.open();
    },
    close(){//public
      this.$refs.modal.close();
    },
    onOpen(){
      
    },
    onClose(){
      this.clear();
    },
    clear(){
      this.text='';
      this.executorGroupName=null;
    },
    ...mapActions({
      setTask:'remedy/setTask',
      setVal:'remedy/setVal',
    }),
    async addTaskComment(){
      const {taskId,text,userLogin,executorLogin,executorGroupId}=this;
      const commentList=[new function(){
        this.author=userLogin
        this.text=text
      }];
      await this.setTask({taskId,executorLogin,executorGroupId,commentList});
      this.$router.push({name:'tasks-list',params:{tasksListName:ENGINEER_TASKS.INITIAL}});
      this.setVal({setTaskResult:null});
    }
  },
});
