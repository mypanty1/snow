//redirect
ENGINEER_TASKS.b2cEngineerListsItems=select(ENGINEER_TASKS.lists,{name:(name)=>/^B2C_/.test(name)&&name!=='B2C_WFM'})
app.$router.beforeEach((to,from,next)=>{
  if(to.name=='tasks-list'){
    to.matched[0].components.default=Vue.component('TasksPage2',{
      template:`<div class="position-relative padding-bottom-8px">
        <PageNavbar :title="taskOnDateTitle" @refresh="getTasks({refresh:!0})" :loading="loadingOrUpdate||loadingSomeB2BTasksList" @back="$refs.CalendarDatePicker_modal.open()" backIcon="calendar" :disabled="loadingOrUpdate||loadingSomeB2BTasksList"">
          <template slot="btn-right" v-if="isB2BEngineer&&!loadingSomeB2BTasksList"">
            <button-sq tn="btn-open-filter" @click="$refs.TasksFilterModal.open()" :disabled="loadingOrUpdate||loadingSomeB2BTasksList">
              <IcIcon name="Settings2" color="#5642BD" size="24"/>
            </button-sq>
          </template>
        </PageNavbar>
        <TasksFilterModal ref="TasksFilterModal"/>

        <div v-if="isB2BEngineer" class="bg-tone-100 padding-left-right-8px margin-bottom-8px">
          <LineScrollSelector2 :selectedItem="tasksListItem" :items="engineerTasksLists" :counters="counters" hideZeroCounter idKey="name" labelKey="title" @onSelect="$router.push({name:'tasks-list',params:{tasksListName:$event.name}})"/>
        </div>
        <div v-else class="display-flex gap-6px bg-tone-100 padding-left-right-8px padding-top-bottom-6px margin-bottom-8px">
          <div class="display-flex align-items-center min-width-100px">
            <selector-mini :value="tasksListItem" :items="Object.values(engineerTasksLists)" itemKey="title" @input="$router.push({name:'tasks-list',params:{tasksListName:$event.name}})"/>
          </div>
          <LineScrollSelector :items="tasksListItem?.taskStatusesItemsList||[]" @onSelect="setFilterStatusName($event?.statusName)"/>
        </div>

        <transition name="slide-page" mode="out-in" appear>
          <TasksListLoader v-if="tasksLoading"/>
          <TasksListEmpty v-else-if="tasksListEmptyMessage"/>
          <EngineerTasks v-else/>
        </transition>
        <modal-container ref="CalendarDatePicker_modal" @close="getTasks({date,refresh:!0})">
          <CalendarDatePicker :initialDate="date" @set:date="setDate" @close="$refs.CalendarDatePicker_modal.close()"/>
        </modal-container>
      </div>`,
      beforeRouteEnter(to,from,next){
        if(!to.params.tasksListName||to.params.tasksListName==ENGINEER_TASKS.defaultTasksListListName||!ENGINEER_TASKS.lists[to.params.tasksListName]){
          next({
            name:'tasks-list',
            params:{
              tasksListName:store.getters.isB2BEngineer?ENGINEER_TASKS.lists.B2B_Remedy.name:ENGINEER_TASKS.lists.B2C_WFM_old.name
            }
          });
          return;
        };
        if(to.params.tasksListName==ENGINEER_TASKS.lists.B2C_WFM.name){
          next({
            name:'tasks-list',
            params:{
              tasksListName:ENGINEER_TASKS.lists.B2C_WFM_old.name
            }
          });
          return;
        };
        next(vm=>{ 
          vm.setTasksListName(to.params.tasksListName);
          if(to.params.tasksListName!==ENGINEER_TASKS.lists.B2C_WFM.name){
            vm.getTasks({date:vm.date});
          }
        });
      },
      beforeRouteUpdate(to,from,next){
        if(to.params.tasksListName==ENGINEER_TASKS.lists.B2C_WFM.name){
          next({
            name:'tasks-list',
            params:{
              tasksListName:ENGINEER_TASKS.lists.B2C_WFM_old.name
            }
          });
          return;
        };
        this.setTasksListName(to.params.tasksListName);
        if(to.params.tasksListName!==ENGINEER_TASKS.lists.B2C_WFM.name){
          this.getTasks({date:this.date});
        };
        next();
      },
      computed:{
        taskOnDateTitle(){return `Наряды на ${this.date.toLocaleDateString()}`},
        tasksListItem(){return ENGINEER_TASKS.lists[this.$route.params.tasksListName]},
        engineerTasksLists(){this.isB2BEngineer?ENGINEER_TASKS.b2bEngineerListsItems:ENGINEER_TASKS.b2cEngineerListsItems},
        ...mapGetters([
          'isB2BEngineer'
        ]),
        ...mapGetters({
          username:'main/username',
          date:'tasks/date',
          tasksLoading:'tasks/tasksLoading',
          tasksError:'tasks/tasksError',
          tasks:'tasks/tasks',
          tasksCount:'tasks/tasksCount',
          tasksFiltered:'tasks/tasksFiltered',
          tasksFilteredCount:'tasks/tasksFilteredCount',
          tasksListEmptyMessage:'tasks/tasksListEmptyMessage',
          tasksUpdate:'cm/tasksUpdate',
          siebelTasksLoading:'siebel_b2b/tasksLoading',
          remedyTasksLoading:'remedy_b2b/tasksLoading',
        }),
        loadingSomeB2BTasksList(){return [this.siebelTasksLoading,this.remedyTasksLoading].some(Boolean)},
        cmWfmTasksUpdateLoading(){return this.$route.params.tasksListName==ENGINEER_TASKS.lists.B2C_WFM.name&&this.tasksUpdate},
        loadingOrUpdate(){return this.cmWfmTasksUpdateLoading||this.tasksLoading},
        ...mapGetters({
          siebelB2BTasksFilteredCount:'siebel_b2b/tasksFilteredCount',
          remedyB2BTasksFilteredCount:'remedy_b2b/tasksFilteredCount',
        }),
        counters(){
          return {
            [ENGINEER_TASKS.lists.B2B_Siebel.name]:this.siebelB2BTasksFilteredCount||parseInt(randcode(4,'123456789')),
            [ENGINEER_TASKS.lists.B2B_Remedy.name]:this.remedyB2BTasksFilteredCount,
          }
        }
      },
      methods:mapActions({
        setDate:'tasks/setDate',
        setTasksListName:'tasks/setTasksListName',
        setFilterStatusName:'tasks/setFilterStatusName',
        getTasks:'tasks/getTasks',
      }),
    });
  };
  next()
});
