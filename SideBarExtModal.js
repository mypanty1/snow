
//add SideBarExtModal

Vue.component('SideBarExtModal',{
  template:`<modal-container-custom name="SideBarExtModal" ref="modal" :footer="false" :wrapperStyle="{'min-height':'auto','margin-top':'4px'}">
    <div class="padding-left-right-16px">
      <div class="display-flex flex-direction-column gap-8px">
        <div class="font--15-600 text-align-center">Дополнительно</div>
        
        <div class="display-flex flex-direction-column">
          
        </div>
      </div>
      <div class="margin-top-16px display-flex justify-content-space-around">
        <button-main label="Закрыть" @click="close" buttonStyle="outlined" size="medium"/>
      </div>
    </div>
  </modal-container-custom>`,
  data:()=>({
    
  }),
  computed:{
    
  },
  methods:{
    open(){//public
      this.$refs.modal.open();
    },
    close(){//public
      this.$refs.modal.close();
    },
  },
});

Vue.component('menu-sidebar',{
  template:`<div name="menu-sidebar">
    <transition name="menu-fade">
      <div v-if="opened" class="menu-overflow" @click.self="close"></div>
    </transition>
    <transition name="menu-slide">
      <div v-if="opened" class="main-menu">
        <div class="menu-sidebar">
          <div class="header-container">
            <div class="logo-box">
              <div class="logo-inetcore">
                <app-logo />
              </div>
              <button class="btn-head" @click="close">
                <IcIcon name="fas fa-times"/>
              </button>
            </div>
          </div>

          <div class="menu-sidebar-body">
            <GreetingCard/>
            <div class="menu-block">
              <div class="display-flex flex-direction-column gap-16px">
                <div @click="toTasksRoute('WFM')" class="display-flex align-items-center gap-8px">
                  <IcIcon name="fa fa-tasks" color="#2c98f0" class="font-size-22px"/>
                  <span>Наряды WFM</span>
                  <IcIcon name="loading" size="22" class="rotating main-lilac" v-if="wfmTasksLoading"/>
                  <IcIcon name="warning" size="22" class="main-orange" v-if="wfmTasksError"/>
                  <div class="display-flex align-items-center gap-4px" v-else-if="wfmTasksCount">
                    <span class="tone-500">•</span><span>{{wfmTasksCount}}</span>
                  </div>
                  <div class="margin-left-auto">
                    <IcIcon name="fa fa-chevron-right"/>
                  </div>
                </div>

                <div @click="toTasksRoute('Remedy')" class="display-flex align-items-center gap-8px">
                  <IcIcon name="fa fa-tasks" color="#3876a9" class="font-size-22px"/>
                  <span>Работы Remedy</span>
                  <IcIcon name="loading" size="22" class="rotating main-lilac" v-if="remedyTasksLoading"/>
                  <IcIcon name="warning" size="22" class="main-orange" v-if="remedyTasksError"/>
                  <div class="display-flex align-items-center gap-4px" v-else-if="remedyTasksCount">
                    <span class="tone-500">•</span><span>{{remedyTasksCount}}</span>
                  </div>
                  <div class="margin-left-auto">
                    <IcIcon name="fa fa-chevron-right"/>
                  </div>
                </div>

                <div @click="$router.push({name:'favs'})" class="display-flex align-items-center gap-8px">
                  <IcIcon name="BookmarkAdd" color="#FF0032" size="22"/>
                  <span>Избранное</span>
                  <IcIcon name="loading" size="22" class="rotating main-lilac" v-if="favsLoading"/>
                  <div class="display-flex align-items-center gap-4px" v-else-if="favsCount">
                    <span class="tone-500">•</span><span>{{favsCount}}</span>
                  </div>
                  <div class="margin-left-auto">
                    <IcIcon name="fa fa-chevron-right"/>
                  </div>
                </div>

                <div @click="showFeedbackModal" class="display-flex align-items-center gap-8px">
                  <IcIcon name="far fa-comment-dots" color="#00bcd4" class="font-size-22px"/>
                  <span>Обратная связь</span>
                </div>
                <modal-container-custom ref="feedback_modal_container" :header="false" :wrapperStyle="{'min-height':'unset','margin-top':'4px'}">
                  <feedback-modal ref="feedback_modal"/>
                </modal-container-custom>
                <div v-if="appInfo.version" @click="showChangelogModal" class="display-flex align-items-center gap-8px">
                  <IcIcon name="fas fa-info-circle" color="#ff9800" class="font-size-22px"/>
                  <span>Что нового</span>
                  <IcIcon name="loading" size="22" class="rotating main-lilac" v-if="loads.appInfo"/>
                </div>
                <modal-container-custom ref="changelog_modal_container" :footer="false" :wrapperStyle="{'min-height':'unset','margin-top':'4px'}">
                  <changelog-modal :appInfo="appInfo" @close="closeChangelogModal"/>
                </modal-container-custom>

                <div v-if="urls" @click="reference_modal_open" class="display-flex align-items-center gap-8px">
                  <IcIcon name="far fa-question-circle" color="#6421b8" class="font-size-22px"/>
                  <span>Справка</span>
                  <IcIcon name="loading" size="22" class="rotating main-lilac" v-if="loads.urls"/>
                </div>
                <reference-modal ref="reference_modal" :urls="urls"/>
                
                <template v-if="username=='mypanty1'">
                <div @click="$refs.SideBarExtModal.open()" class="display-flex align-items-center gap-8px">
                  <IcIcon name="fas fa-grip-horizontal" color="#2139b8" class="font-size-22px"/>
                  <span>Дополнительно</span>
                </div>
                <SideBarExtModal ref="SideBarExtModal"/>
                </template>
                
                <template v-for="item in phones">
                  <collapse>
                    <template slot="title">
                      <div class="display-flex align-items-center gap-8px">
                        <IcIcon name="fas fa-phone" class="font-size-22px label-img_green"/>
                        <span>{{item.title}}</span>
                        <IcIcon name="loading" size="22" class="rotating main-lilac" v-if="loads.phones"/>
                      </div>
                    </template>
                    <div class="margin-top-8px font-weight-normal menu-call">
                      <span class="font--12-400">{{item.description}}</span>
                      <button @click="sendPhoneLog(item)" class="margin-top-8px margin-bottom-8px menu-button-call" :success="true" :showIcon="false">
                        <span>Позвонить</span>
                      </button>
                    </div>
                  </collapse>
                </template>
              </div>
            </div>
            <div class="history-block">
              <div class="history-title display-flex align-items-center justify-content-space-between">
                <span>История</span>
                <span class="fa fa-history font-size-14px"></span>
              </div>
              <div class="display-flex flex-direction-column">
                <router-link v-for="route of routerHistory" :key="route.path" :to="getRoute(route)" class="display-flex align-items-center justify-content-space-between">
                  <span :title="route.path">{{getRouteLabel(route)}}</span>
                  <IcIcon name="right-link" class="tone-500"/>
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>`,
  props:{
    opened:{type:Boolean,default:false}
  },
  data:()=>({
    phones:[],
    urls:{},
    appInfo:{},
    loads:{
      urls:false,
      phones:false,
      appInfo:false,
    },
  }),
  created(){
    this.getPhones();
    this.getAppInfo();
    this.getUrls();
  },  
  computed:{
    routerHistory(){
      return this.$root.routerHistory.slice(-10).reverse();
    },
    ...mapGetters({
      wfmTasksLoading:'wfm/wfmTasksLoading',
      wfmTasksError:'wfm/wfmTasksError',
      wfmTasksCount:'wfm/wfmTasksCount',
      remedyTasksLoading:'remedy/remedyTasksLoading',
      remedyTasksError:'remedy/remedyTasksError',
      remedyTasksCount:'remedy/remedyTasksCount',
      favsLoading:'favs/favsLoading',
      favsCount:'favs/favsCount',
      region_id:'main/region_id',
      username:'main/username',
    }),
  },
  methods:{
    showFeedbackModal(){
      this.$refs.feedback_modal_container.open();
    },
    showChangelogModal(){
      if(this.appInfo?.version){
        this.$refs.changelog_modal_container.open();
      };
    },
    reference_modal_open(){
      if(!this.urls){return};
      this.$refs.reference_modal.open();
    },
    closeChangelogModal(){
      this.$refs.changelog_modal_container.close();
    },
    sendPhoneLog(item) {
      CustomRequest.post('/call/main/support',{
        abon:{
          address:item.name,
          page:window.location.pathname+window.location.hash,
        },
        message:'calls',
        messageType:'calls',
        window:'ptvtb',
      }).catch(e=>console.error(e));
      window.location.href=`tel:${item.phone}`;
    },
    close(){
      this.$emit('close');
    },
    toTasksRoute(mode=''){
      this.$router.push({name:'tasks-mode',params:{mode}});
      this.$root.toggleMenu();
    },
    async getPhones(){
      this.loads.phones=true;
      const resp=await CustomRequest.get(buildUrl('setup',{act:'phones'},'/call/main/'))
      if(resp?.data){this.phones=resp.data};
      this.loads.phones=false;
    },
    async getUrls(){
      this.loads.urls=true;
      const resp=await CustomRequest.get(buildUrl('setup',{act:'urls'},'/call/main/'))
      if(resp?.data){this.urls=resp.data};
      this.loads.urls=false;
    },
    async getAppInfo(){
      this.loads.appInfo=true;
      const resp=await httpGet('/call/main/app_info')
      this.appInfo=resp||{};
      this.loads.appInfo=false;
    },
    getRoute({name,params}){
      return {name,params};
    },
    getRouteLabel(route){
      const key=['sn','id','device_id','rack_id','entrance_id','site_id','accountId','text'].find(key=>route.params[key]);
      return route.params[key]||`[${route.name||'!name'}]`;
    }
  },
});