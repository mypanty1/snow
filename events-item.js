//add hc event object nav
//TODO: подробности в зависимых
Vue.component('events-item',{
  template:`<div name="events-item" :class="[event.active&&'bg-attention-warning']">
    <title-main v-bind="titleProps" text2Class="tone-500 font--13-500" :opened="open" @open="open=!open"/>
    <title-main :text="event.notification_id||event.id" :text2="titleStatus" textClass="font--13-500" text2Class="tone-500 font--13-500" @block-click="copy(event.id)" class="margin-top--20px">
      <button-sq icon="copy" type="medium"/>
    </title-main>
    <title-main v-if="open&&event.parent" text="МИ" :text2="event.parent" devider=":" textClass="tone-500 font--13-500" text2Class="tone-500 font--13-500" class="margin-top--10px"/>
    <title-main icon="ls" v-if="event.contract" :text="event.contract" :text2="titleFlat" textClass="font--13-500" text2Class="tone-500 font--13-500" @block-click="toAccount" class="margin-top--10px">
      <button-sq icon="right-link" type="medium"/>
    </title-main>
    
    <template v-if="open">
      <info-value label="Начало" :value="dates.start" withLine/>
      <info-value label="Длительность" :value="dates.duration" withLine/>
      <info-value v-if="event.deadline" :label="event.sla?'SLA до':'Срок'" :value="dates.deadline" withLine/>
      <info-value v-if="!event.active" label="Окончание" :value="dates.end" withLine/>
      <info-value label="Статус" :value="event.status_description||event.status" withLine/>
      <devider-line m="8px 16px"/>
      
      <template v-if="notify">
        <info-value v-for="([label,value,action],key) of notify" :key="key" v-bind="{label,value}" withLine>
          <div v-if="action" slot="action" class="margin-left-4px">
            <div @click="$router.push({name:'search',params:{text:value}})" class="ic-20 ic-right-1 main-lilac bg-main-lilac-light border-radius-4px"></div>
          </div>
        </info-value>
        <devider-line m="8px 16px" />
      </template>
      
      <info-text-sec v-if="event.problem" title="Описание" :text="event.problem" class="margin-bottom-4px"/>
      <info-text-sec v-if="event.problem_description" title="Доп. информация" :text="event.problem_description" class="margin-bottom-4px"/>
      <info-text-sec v-if="details" title="Дополнительно" :text="details" class="margin-bottom-4px"/>
      <info-text-sec v-if="event.solution" title="Решение" :text="event.solution" class="margin-bottom-4px"/>
      
      <template v-if="event.ops&&(event.ops.name||event.ops.login)">
        <devider-line m="8px 16px" />
        <info-text-sec title="Исполнитель" :text="event.ops.name||event.ops.login" class="margin-bottom-4px"/>
        <account-call v-if="event.ops.phone" :phone="event.ops.phone" :descr="event.ops.name||event.ops.login" class="margin-bottom-4px" showSendSms/>
        <info-text-sec :text="event.ops.data" class="margin-bottom-4px"/>
      </template>
      
      <template v-if="event.flats && event.flats.length">
        <devider-line m="8px 16px"/>
        <info-text-sec title="Квартиры" :text="event.flats.join(', ')" class="margin-bottom-4px"/>
      </template>
      
      <template v-if="getAccident(event).length">
        <devider-line m="8px 16px"/>
        <info-text-sec title="Зависимые события"/>
        <info-value v-for="({rangeDate,uid}) of getAccident(event)" label="Авария" :value="rangeDate" :key="uid" withLine/>
      </template>
    </template>
  </div>`,
  props:{
    event:{type:Object,required:true},
  },
  data:()=>({
    open:false
  }),
  computed:{
    titleFlat(){
      const {flats,details}=this.event;
      const flat=flats?.[0]||details?.location||'';//6-091-0271166 • кв. 109, под 4, эт 1
      return (flat?`кв. ${flat}`:'').replace('кв. кв','кв.');//6-091-0048532 • кв. кв 133
    },
    titleProps(){
      const {type}=this.event;
      const props={
        singleIncident  :{text:'ЕИ',icon:'incident'},
        massIncident    :{text:'МИ',icon:'incident'},
        work            :{text:'ППР',icon:'ppr'},
        accident        :{text:'Авария',icon:'incident'},
        connection      :{text:'Подключение',icon:'task'},
      }[type]||{text:'Работа',icon:'info'};
      const {started_at,finished_at,deadline,active}=this.event;
      const {startDate,endDate,slaEnd}=this.dates;
      return {
        ...props,
        icon:`${props.icon} ${active?'main-orange':''}`,
        textClass:active?'main-orange':'',
        text2:!started_at?'':startDate+(finished_at?(' - '+endDate):(deadline?(' до '+slaEnd):'')),
       };
    },
    titleStatus(){
      const {status_description,status}=this.event;
      const text=(status_description||status)+'';
      return text.length>12?(text.slice(0,12)+'...'):text;
    },
    dates() {//todo: сделать исключение по датам для events_by_contract и event_list
      class EventDates {
        constructor(event){
          const isFormatted=!event.started_at.includes('+');//"2023-06-10T06:35:30.000+03:00""30.06.2023 23:24"
          const started_at=new Date(isFormatted?this.toLocalDateISO(this.strMskToISO(event.started_at),3):event.started_at);
          const finished_at=new Date(isFormatted?this.toLocalDateISO(this.strMskToISO(event.finished_at),3):event.finished_at);
          const deadline=new Date(isFormatted?this.toLocalDateISO(this.strMskToISO(event.deadline),3):event.deadline);
          this.start=`${this.getTimeHHMM(started_at)} • ${this.getDateDDMMYYY(started_at)}`
          this.startDate=this.getDateDDMMYYY(started_at)
          this.end=`${this.getTimeHHMM(finished_at)} • ${this.getDateDDMMYYY(finished_at)}`
          this.endDate=this.getDateDDMMYYY(finished_at)
          this.duration=Datetools.duration(event.duration*1000)
          this.deadline=`${this.getTimeHHMM(deadline)} • ${this.getDateDDMMYYY(deadline)}`
          this.slaEnd=`${this.getDateDDMMYYY(deadline)} ${this.getTimeHHMM(deadline)}`
        }
        getTimeHHMM(date){return date.toLocaleTimeString().slice(0, 5)};
        getDateDDMMYYY(date){return date.toLocaleDateString()};
        strMskToISO(str){//"30.06.2023 23:24"
          const [dd,MM,yyyy,hh,mm]=str.split(/[.\s:]/);
          return `${yyyy}-${MM}-${dd}T${hh}:${mm}:00.240Z`;
        }
        toLocalDateISO(_date,z=0){//z - чп источника
          const date=new Date(_date);
          if(date=='Invalid Date'){return _date};
          const offset=new Date().getTimezoneOffset()/-60;
          date.setHours(date.getHours()-(z)+offset);
          return date.toISOString().split('.')[0];
        }
      };
      return new EventDates(this.event);      
    },
    notify(){
      const {type_name,name,element_name,event_name}=this.event;
      if(type_name!=='Accident'){return};
      const [_n,_object,object_event]=name.replace(/__/g,'---').split(/_/);
      const [n,object_type]=_n.split(/-/);
      const object_name=_object.replace(/---/g,'_');
      const isSubObject=object_name&&(element_name!=object_name);
      return [
        !!element_name&&['СЭ',element_name,!!element_name],
        isSubObject&&['Объект',object_name,!!object_name],
        !!object_event&&[object_type||'Событие',object_event]
      ].filter(v=>v);
    },
    details(){
      const {details:{siebel_id,service_type,subject,location}={}}=this.event;
      return [siebel_id,service_type,subject,location].filter(v=>v).join(' ');
    },
  },
  methods: {
    getAccident(event) {
      function getFormattedDate(dateStr, delimetr = ' • ') {
        if (!dateStr) return 'Нет данных';
        const [date, time] = dateStr.split(' ');
        return `${time || ''}${delimetr}${date || ''}`;
      };
      return (event?.children||[]).filter(({type})=>type==='accident').map(ch=>{
        ch.rangeDate=`${getFormattedDate(ch.started_at, ' ')} -  ${getFormattedDate(ch.finished_at, ' ')}`
        return ch
      });
    },
    copy(text){
      copyToBuffer(text);
    },
    toAccount(){
      const {contract}=this.event;
      if(!contract){return};
      this.$router.push({
        name:'account-proxy',
        params:{
          accountId:contract,
        },
      });
    },
  },
});
