//calc last event
Vue.component("PortLogsModal",{
  template:`<modal-container-custom name="PortLogsModal" ref="modal" @open="openedEvent" header :footer="false" :wrapperStyle="{'min-height':'auto','margin-top':'4px'}">
    <div class="margin-left-right-16px">
      
      <div class="margin-bottom-8px">
        <div class="display-flex align-items-center gap-4px">
          <switch-el class="width-40px" v-model="enablePortFilter"/>
          <div class="font--13-500" v-if="enablePortFilter">Логи по порту {{port.snmp_name}}</div>
          <div class="font--13-500 tone-500" v-else>Логи по коммутатору {{networkElement.ip}}</div>
        </div>
        <div class="display-flex align-items-center gap-4px" v-show="enablePortFilter">
          <switch-el class="width-40px" v-model="enableLinkFilter"/>
          <div class="font--13-500" v-if="enableLinkFilter">Только линк</div>
          <div class="font--13-500 tone-500" v-else>Все события {{rowsFilteredCount?('('+rowsFilteredCount+')'):''}}</div>
        </div>
      </div>
      
      <loader-bootstrap v-if="loading" text="получение логов с коммутатора"/>
      <message-el v-else-if="error" text="Ошибка получения данных" :subText="error" box type="warn"/>
      <message-el v-else-if="!rowsFilteredCount&&enablePortFilter" text="Нет событий по порту" box type="info"/>
      <template v-else>
        <PortLogLinkEventsChart v-if="showPortLogLinkEventsChart" :events="events" class="margin-bottom-8px"/>
        <div class="display-flex flex-direction-column gap-1px">
          <template v-for="(row,index) of rowsFiltered">
            <devider-line v-if="index" m="unset"/>
            <PortLogRow :key="row.row_index" v-bind="row" :hideNotParsed="hideNotParsed"/>
          </template>
        </div>
      </template>
      
    </div>
    <div class="margin-top-16px width-100-100 display-flex align-items-center justify-content-space-around">
      <button-main label="Закрыть" @click="close" buttonStyle="outlined" size="medium"/>
      <button-main label="Обновить" @click="refresh" :disabled="loading" buttonStyle="outlined" size="large"/>
    </div>
  </modal-container-custom>`,
  props:{
    port:{type:Object,required:true},
    networkElement:{type:Object,required:true},
  },
  data:()=>({
    loading:false,
    error:'',
    log:[],
    rowsParsed:[],
    enablePortFilter:true,
    enableLinkFilter:true,
    minRowLength:30,
    minEventsCount:2,
  }),
  watch:{
    'loading'(loading){
      this.$emit('loading',loading)
    },
    'log'(){
      this.rowsParsed=this.log.map((row,row_index)=>{
        return {...this.parseRow(row),row_index}
      }).filter(({logDate})=>logDate)
    }
  },
  computed:{
    hideNotParsed(){return this.enablePortFilter&&this.enableLinkFilter},
    rowsFiltered(){
      return this.rowsParsed.filter(({row,portIsFinded})=>{
        return row&&row.length>=this.minRowLength&&(this.enablePortFilter?portIsFinded:true)
      })
    },
    rowsFilteredCount(){return this.rowsFiltered.length},
    showPortLogLinkEventsChart(){
      return this.rowsFilteredCount>=this.minEventsCount&&this.enablePortFilter&&this.enableLinkFilter&&this.events.length>=this.minEventsCount;
    },
    events(){
      return this.rowsParsed.reduce((events,{row,texts,logDate,portIsFinded,isLinkUp,isLinkDn,portText},index,rows)=>{
        if(!logDate){return events};
        const {formatted,time}=logDate;
        if(portIsFinded&&(isLinkUp||isLinkDn)){
          events.push({
            time,
            date:formatted,
            state:!!isLinkUp,
          });
        }else if(!index){
          const last=rows.find(({logDate,portIsFinded,isLinkUp,isLinkDn})=>logDate&&portIsFinded&&(isLinkUp||isLinkDn))
          events.push({
            time,
            date:formatted,
            state:!!last?.isLinkUp,
          });
        };
        return events
      },[]);
    },
  },
  methods:{
    open(){//public
      this.$refs.modal.open()
    },
    close(){//public
      this.$refs.modal.close()
    },
    openedEvent(){
      this.getLogShort();
    },
    refresh(){
      this.getLogShort();
    },
    async getLogShort(){
      this.loading=true;
      this.error="";
      this.log=[];
      try{
        const response=await httpPost(buildUrl('log_short',objectToQuery({
          mr_id:this.networkElement.region.mr_id,
          ip:this.networkElement.ip,
          //ifName:this.port.snmp_name,
        }),'/call/hdm/'),{
          port:{
            //SNMP_PORT_NAME:this.port.snmp_name,
            //PORT_NUMBER:this.port.number,
            //name:this.port.name
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
            //name:this.networkElement.name
          }
        });
        if(response.message==="OK"&&Array.isArray(response.text)){
          if(this.networkElement.vendor=='H3C'){//temp, need reverse
            this.log=response.text.reverse();
          }else{
            this.log=response.text;
          };
        }else if(response.error){
          this.error=response.text;
        }
      }catch(error){
        this.error='unexpected';
        console.warn("log_short.error",error)
      };
      this.loading=false;
    },
    parseRow(row){
      const {bgPort,cText,bgLinkUp,bgLinkDn,bgDate}=PORT_LINK_LOGS.row;
      let logDate=null;
      let portIsFinded=false;
      let isLinkUp=false;
      let isLinkDn=false;
      
      const texts=[];
      
      logDate=PORT_LINK_LOGS.getLogRowDate(row)||null;
      let _texts_date_around=!logDate?.date?[row]:` ${row}`.split(logDate.parsed);
      let _texts_after_date=[];
      if(_texts_date_around.length>=2&&logDate?.formatted){
        const [text0_before_date,...texts_after_date]=_texts_date_around;
        _texts_after_date=texts_after_date;
        texts.push(...[
          /*{text:text0_before_date},*/
          {
            text:logDate.formatted,
            style:{
              'background-color':bgDate,
              'color':cText,
            }
          },
        ]);
      }else{
        _texts_after_date=_texts_date_around;
      };
      
      const {portText,portRegExp}=PORT_LINK_LOGS.getPortNameRegExpByVendor(this.networkElement.vendor,this.port);
      const _texts_port_around=`${_texts_after_date.join(' ')}  `.split(portRegExp);
      let _texts_after_port=[];
      portIsFinded=false;
      if(_texts_port_around.length>=2){
        const [text0_before_port,...__texts_after_port]=_texts_port_around;
        _texts_after_port=__texts_after_port;
        texts.push(...[
          {text:text0_before_port},
          {
            text:portText,
            style:{
              'background-color':bgPort,
              'color':cText,
            }
          },
        ]);
        portIsFinded=true;
      }else{
        _texts_after_port=_texts_port_around;
      };
      
      const {linkUpRegExp,linkDnRegExp}=PORT_LINK_LOGS.getLinkStateRegExpByVendor(this.networkElement.vendor);
      const _row_after_port=_texts_after_port.join(` ${portText} `);
      const _texts_linkup_around=_row_after_port.split(linkUpRegExp);
      const _texts_linkdn_around=_row_after_port.split(linkDnRegExp);
      isLinkUp=_texts_linkup_around.length>=2;
      isLinkDn=_texts_linkdn_around.length>=2;
      const _texts_link_around=isLinkUp?_texts_linkup_around:isLinkDn?_texts_linkdn_around:_texts_after_port;
      const [text0_before_link,..._texts_after_link]=_texts_link_around;
      if(isLinkUp||isLinkDn){
        texts.push(...[
          {text:text0_before_link},
          {
            text:isLinkUp?'LinkUp':'LinkDown',
            style:{
              'background-color':isLinkUp?bgLinkUp:bgLinkDn,
              'color':cText,
            }
          },
          ..._texts_after_link.map(text=>text.split(' ').filter(v=>v).map(text=>({text}))).flat(),
        ]);
      }else{
        isLinkUp=false;
        isLinkDn=false;
        texts.push(..._texts_after_port.map(text=>text.split(' ').filter(v=>v).map(text=>({text}))).flat())
      };
      
      return {row,texts,logDate,portIsFinded,isLinkUp,isLinkDn,portText}
    },
  },
});
