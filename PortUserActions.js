//sort
Vue.component("PortUserActions",{
  template:`<div name="PortUserActions" class="display-contents">
    <title-main text="Действия" :opened="open" @block-click="open=!open" textSize="medium"/>
    <template v-if="open">
      <component v-for="({props,listeners},key) of actions" :key="key" v-bind="props" v-on="listeners"/>
    </template>
  </div>`,
  props:{
    port:{type:Object,required:true,default:null},
    networkElement:{type:Object,required:true,default:null},
    disabled:{type:Boolean,default:false},//loadingSome
    status:{type:Object,default:null},
  },
  data:()=>({
    open:true,
    loads:{
      PortActionAbonBind:false,
      PortActionCableTest:false,
      PortLogs:false,
      PortActionIptvDiag:false,
      PortActionMac:false,
      PortActionIpMacPortBind:false,
      PortActionReboot:false,
      PortActionDisable:false,
    }
  }),
  watch:{
    'loadingSome'(loadingSome){
      this.$emit("loading",loadingSome);
    }
  },
  computed:{
    blocks(){
      const {is_trunk,is_link,state}=this.port;
      const isTechPort=is_trunk||is_link;
      const isTechPortLinkUp=isTechPort&&(this.status?.IF_OPER_STATUS||!this.status?.IF_ADMIN_STATUS);
      const isBad=state==='bad';
      const isAccess=!state?false:(!is_trunk&&!is_link&&!state.includes('trunk'));//со страницы наряда модель порта не полная
      return {
        PortActionReboot:isTechPortLinkUp||this.disabled||isBad,
        PortActionDisable:isTechPort||!isAccess||this.disabled,
        PortActionAbonBind:false,
        PortActionCableTest:isTechPortLinkUp||this.disabled,
        PortLogs:false,
        PortActionIptvDiag:false,
        PortActionMac:this.disabled,
        PortActionIpMacPortBind:isTechPort||this.disabled,
      }
    },
    loadingSome(){return Object.values(this.loads).some(l=>l)},
    actions(){
      const {port,networkElement}=this;
      return Object.keys(this.loads).map(name=>{
        return {
          props:{
            is:name,
            networkElement,
            port,
            disabled:this.disabled||this.loadingSome||this.blocks[name]||false,
          },
          listeners:{
            loading:(event)=>{
              this.eventLoading(name,event)
            },
            callParent:(event)=>{
              this.$emit('callParent',event)
            },
          }
        }
      })
    }
  },
  methods:{
    eventLoading(action,event){
      this.$set(this.loads,action,event);
    }
  },
});

