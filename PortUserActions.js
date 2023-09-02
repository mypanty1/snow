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

Vue.component("PortActionMac", {
  template:`<section name="PortActionMac">
    <link-block icon="mac" text="MAC-адрес_2" @block-click="loadMacs" :disabled="disabledBtn" :loading="loading" actionIcon="down" data-ic-test="load_mac_btn"/>
    <template v-if="!loading&&rows.length">
      <PortEntitiesByMac v-for="({text,mac},key) of rows" :key="key" v-bind="{text,mac}" :oui="ouis[mac]" :mr_id="networkElement.region.mr_id" :region_id="networkElement.region.id" :noSession="rows.length>2"/>
    </template>

    <info-list v-if="text&&!loading" :text="text"/>

    <message-el v-if="clear_success" text="MAC очищен" class="margin-top-8px margin-bottom-8px margin-left-16px" data-ic-test="clear_mac_result"/>
    <div v-if="!loading&&rows.length" class="padding-8px-16px">
      <button-main @click="clearMac" label="Очистить MAC " icon="" :loading="loading_clear" :disabled="disabledBtn" buttonStyle="outlined" size="full" data-ic-test="clear_mac_btn"/>
    </div>
  </section>`,
  props: {
    port:{type:Object,required:true},
    networkElement:{type:Object,required:true},
    disabled:{type:Boolean,default:false},
  },
  data: () => ({
    loading: false,
    loading_clear: false,
    rows: [],//ETH_KR_54_89153_10
    text: "",
    ouis: {},
    clear_success: false,
  }),
  created() {
    this.clear_success = false;
  },
  watch:{
    'loading'(loading){
      this.$emit('loading',loading)
    },
    'loading_clear'(loading_clear){
      this.$emit('loading',loading_clear)
    }
  },
  computed: {
    disabledBtn() {
      return this.disabled || this.loading || this.loading_clear;
    },
  },
  methods: {
    async parse(rows){
      const {items,macs}=rows.reduce((result,_row)=>{//ffff.ffff.ffff,ff:ff:ff:ff:ff:ff
        const row=String(_row);
        const mac=row.match(/(([0-9A-Fa-f]{4}[.-]){2}([0-9A-Fa-f]{4}))|(([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2}))/gi)?.[0]||'';
        const text=(mac?row.replace(mac,''):row).split(' ').filter(v=>v).join(' • ')
        result.items.push({mac,text});
        if(mac){result.macs.push(mac)};
        return result
      },{items:[],macs:[]});
      this.rows=items;
      this.ouis=await this.test_getMacVendorLookup(macs);
    },
    eventLoadStatus() {
      this.$emit("load:status");
    },
    async loadMacs() {
      this.loading = true;
      this.rows = [];
      this.text = "";
      try {
        const response = await httpGet(buildUrl("port_mac_show",{
          MR_ID: this.networkElement.region.mr_id,
          DEVICE_IP_ADDRESS:this.networkElement.ip,
          DEVICE_SYSTEM_OBJECT_ID:this.networkElement.system_object_id,
          DEVICE_VENDOR:this.networkElement.vendor,
          DEVICE_FIRMWARE:this.networkElement.firmware,
          DEVICE_FIRMWARE_REVISION:this.networkElement.firmware_revision,
          DEVICE_PATCH_VERSION:this.networkElement.patch_version,
          SNMP_PORT_NAME:this.port.snmp_name,
        },"/call/hdm/"));
        if (Array.isArray(response?.text)) {
          this.parse(response.text);
        }
        if (typeof response?.text === "string") {
          this.text = response.text;
        }
      } catch (error) {
        console.warn("port_mac_show.error", error);
      }
      this.loading = false;
    },
    async clearMac() {
      this.clear_success = false;
      this.loading_clear = true;
      try {
        // const response = await Promise.resolve({ message: "OK" });
        const response = await httpPost("/call/hdm/clear_macs_on_port", {
          port:{
            SNMP_PORT_NAME:this.port.snmp_name,
            PORT_NUMBER:this.port.number,
          },
          device:{
            MR_ID:this.networkElement.region.mr_id,
            IP_ADDRESS:this.networkElement.ip,
            SYSTEM_OBJECT_ID:this.networkElement.system_object_id,
            VENDOR:this.networkElement.vendor,
            DEVICE_NAME:this.networkElement.name,
            FIRMWARE:this.networkElement.firmware,
            FIRMWARE_REVISION:this.networkElement.firmware_revision,
            PATCH_VERSION:this.networkElement.patch_version,
          },
        });
        if (response.message === "OK") {
          this.clear_success = true;
          this.eventLoadStatus();
          this.loadMacs();
        }
      } catch (error) {
        console.warn("clear_macs_on_port.error", error);
      }
      this.loading_clear = false;
    },
  },
});


