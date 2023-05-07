
Vue.component('menu-sidebar',{
  template:`<div>
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
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>

          <div class="menu-sidebar-body">
            <img src="https://mypanty1.github.io/snow/day_of_radio_7_may.jpg" style="width:100%">
            <div class="menu-block">
              <ul class="display-flex flex-direction-column gap-30px">
                <li @click="toRoute('WFM')" class="display-flex align-items-center gap-8px">
                  <i class="fa fa-tasks label-img" style="color:#2c98f0;"></i>
                  <span>Наряды WFM</span>
                  <i class="ic-24 ic-loading rotating main-lilac" v-if="wfmTasksLoading"></i>
                  <i class="ic-24 ic-warning main-orange" v-else-if="wfmTasksError"></i>
                  <div class="display-flex align-items-center gap-4px" v-else-if="wfmTasksCount">
                    <span class="tone-500">•</span><span>{{wfmTasksCount}}</span>
                  </div>
                  <i class="fa fa-chevron-right margin-left-auto"></i>
                </li>

                <li @click="toRoute('Remedy')" class="display-flex align-items-center gap-8px">
                  <i class="fa fa-tasks label-img" style="color:#3876a9;"></i>
                  <span>Работы Remedy</span>
                  <i class="ic-24 ic-loading rotating main-lilac" v-if="remedyTasksLoading"></i>
                  <i class="ic-24 ic-warning main-orange" v-else-if="remedyTasksError"></i>
                  <div class="display-flex align-items-center gap-4px" v-else-if="remedyTasksCount">
                    <span class="tone-500">•</span><span>{{remedyTasksCount}}</span>
                  </div>
                  <i class="fa fa-chevron-right margin-left-auto"></i>
                </li>

                <li @click="showFeedbackModal" class="display-flex align-items-center gap-8px">
                  <i class="far fa-comment-dots label-img" style="color:#00bcd4;"></i>
                  <span>Обратная связь</span>
                </li>
                <modal-container-custom ref="feedback_modal_container" :header="false">
                  <feedback-modal ref="feedback_modal"/>
                </modal-container-custom>

                <li v-if="appInfo.version" @click="showChangelogModal" class="display-flex align-items-center gap-8px">
                  <i class="fas fa-info-circle label-img" style="color:#ff9800;"></i>
                  <span>Что нового</span>
                  <i class="ic-24 ic-loading rotating main-lilac" v-if="loads.appInfo"></i>
                </li>
                <modal-container-custom ref="changelog_modal_container" :footer="false" :wrapperStyle="{'min-height':'unset'}">
                  <changelog-modal :appInfo="appInfo" @close="closeChangelogModal"/>
                </modal-container-custom>

                <li v-if="urls" @click="reference_modal_open" class="display-flex align-items-center gap-8px">
                  <i class="far fa-question-circle label-img" style="color:#6421b8;"></i>
                  <span>Справка</span>
                  <i class="ic-24 ic-loading rotating main-lilac" v-if="loads.urls"></i>
                </li>
                <reference-modal ref="reference_modal" :urls="urls"/>

                <template v-for="item in phones">
                  <collapse>
                    <template slot="title">
                      <div class="display-flex align-items-center gap-8px">
                        <i class="fas fa-phone label-img label-img_green"></i>
                        <span>{{item.title}}</span>
                        <i class="ic-24 ic-loading rotating main-lilac" v-if="loads.phones"></i>
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
              </ul>
            </div>
            <div class="history-block">
              <div class="history-title display-flex align-items-center justify-content-space-between">
                <span>История</span>
                <span class="fa fa-history font-size-14px"></span>
              </div>
              <ul class="display-flex flex-direction-column">
                <router-link v-for="route of routerHistory" :key="route.path" :to="getRoute(route)" class="display-flex align-items-center justify-content-space-between">
                  <span :title="route.path">{{getRouteLabel(route)}}</span>
                  <span class="ic-20 ic-right-link tone-500"></span>
                </router-link>
              </ul>
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
  watch:{
    $route(){
      this.$root.showMenu=false;
    },
  },
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
    toRoute(mode=''){
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