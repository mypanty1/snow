Vue.component('app-header',{
  template:`<div class="display-contents">
    <AppHeader3 v-if="isApp||username=='mypanty1'" v-on="$listeners"/>
    <AppHeader2 v-else v-on="$listeners"/>
  </div>`,
  computed:{
    ...mapGetters({
      isApp:'app/isApp',
      username:'main/username',
    }),
  }
});

Vue.component('AppHeader2', {
  template:`<header class="app-header">
     <label for="searchInput" class="app-header__search">
        <div class="app-header__lens" @click="search"><i class="ic-24 ic-search"></i></div>
        <input id="searchInput" class="app-header__input" v-model="searchText" @keyup.self.enter="search" placeholder="Поиск" />
        <div v-if="!!searchText" class="app-header__clear" @click="clear"><i class="ic-24 ic-close"></i></div>
     </label>
     <div class="app-header__buttons">
        <button-sq icon="pin-1" @click="toMap" />
        <button-sq icon="menu" @click="toggleMenu" />
     </div>
  </header>`,
  data: () => ({
    searchText: '',
  }),
  methods: {
    search() {
      const text=this.searchText.trim();
      if(!text){return};
      const route={name:'search',params:{text}};
      if(this.$route.name==='search') {
        this.$router.replace(route);
      }else{
        this.$router.push(route);
      }
      this.clear();
    },
    toggleMenu() {
      this.$emit('toggle-menu');
    },
    toMap() {
      this.$router.push({ name: 'map' });
    },
    clear() {
      this.searchText = '';
    },
  },
});

Vue.component('SearchSuggestItem',{
  template:`<div class="line-height-20px border-radius-4px padding-left-right-4px cursor-pointer" style="border:1px solid #676767;">
    <component v-if="options?.is" :is="options.is" v-bind="{...options.propName?{[options.propName]:value}:null,...options.props||{}}" v-on="options.listeners"/>
    <div v-else class="display-flex gap-2px" @click="$emit('onSelect',value)">
      <IcIcon name="search" color="#676767" class="font-size-16px"/>
      <span class="font--13-500 white-space-pre"><span>{{label}}: </span>{{value}}</span>
    </div>
  </div>`,
  props:{
    label:{type:String,default:''},
    value:{type:String,default:''},
    options:{type:Object,default:null},
  }
});

Vue.component('SearchSuggest',{
  template:`<div name="SearchSuggest" style="z-index:40000;">
    <div class="position-relative">
      <div v-if="items?.length" class="display-flex flex-direction-column gap-2px padding-4px border-radius-8px" style="background:#ffffffaa;">
        <SearchSuggestItem v-for="([label,value,options],key) of items" :key="key" v-bind="{label,value,options}" @onSelect="onSelect"/>
      </div>
    </div>
  </div>`,
  props:{
    sample:{type:String,default:''},
  },
  data(){
    return {
      matchers:[
        ['СЗ',/1-\d{12}/g],
        //['IP',/(\d{1,3}[бю.,./])(3)\d{1,3}/gi,(v)=>v.replace(/[бю.,./]/gi,'.')],
        ['IP',/\d{1,3}[бю.,./]\d{1,3}[бю.,./]\d{1,3}[бю.,./]\d{1,3}/gi,(v)=>v.replace(/[бю.,./]/gi,'.')],
        ['MAC',/[0-9a-f]{2}[:-;_][0-9a-f]{2}[:-;_][0-9a-f]{2}[:-;_][0-9a-f]{2}[:-;_][0-9a-f]{2}[:-;_][0-9a-f]{2}/gi,(v)=>v.replace(/[:-;_]/gi,':').match(/[0-9a-f]{2}/gi).join(':').toUpperCase()],
        ['MAC',/[0-9a-f]{4}[бю.,./][0-9a-f]{4}[бю.,./][0-9a-f]{4}/gi,(v)=>v.replace(/[бю.,./]/gi,'.').match(/[0-9a-f]{2}/gi).join(':').toUpperCase()],
        ['ЛС',/2\d{11}/g],
        ['ЛС',/[1-6]-\d{3}-\d{7}/g],
        ['ЛС',/[1-6]\d{10}/g],
        ['CPE',/(S|Q|F|T|3|Z)[0-9A-Z]{11,14}/gi,(v)=>v.toUpperCase()],
        ['ТЛФ',/(\+|)(7|8)\d{10}/g,,{is:'account-call',propName:'phone',props:{style:'margin:unset !important;'}}],
        ['ТЛФ',/(\+|)(7|8)-\d{3}-\d{7}/g,,{is:'account-call',propName:'phone',props:{style:'margin:unset !important;'}}],
        ['PL',/PL_\d{2}_\d{3,8}/gi,(v)=>v.toUpperCase()],//sample.match(/PL_(?<region_id>\d{1,2})_/i)
        ['SiteID',/\d{19}/g],
        ['УОС',/(гств|пмп|атс|влс|скд|удтс|абк|му|ду|тдчс)(1|0){2}\d{2,8}\D{2,3}(_\d{2})?(-|_)\d{3,5}/g],
        ['Порт',/PORT-([A-ZА]{1,4})(-|_)((\d{2}|\D{2})|(\d{2}\D{2}|\D{2}\d{2})|((\d{2}|\D{2})(-|_)(\d{2}|\D{2})))(-|_)\d{3,7}(-|_)\d{1,3}[/]\d+/gi,(v)=>v.toUpperCase()],
        ['СЭ',/[A-ZА]{1,4}(-|_)((\d{2}|\D{2})|(\d{2}\D{2}|\D{2}\d{2})|((\d{2}|\D{2})(-|_)(\d{2}|\D{2})))(-|_)(\d{3,7})(-|_)\d+/gi,(v)=>v.toUpperCase()],
        ['ШДУ',/(L|CU|ECU)(-|_)((\d{2}|\D{2})|(\d{2}\D{2}|\D{2}\d{2})|((\d{2}|\D{2})(-|_)(\d{2}|\D{2})))(-|_)(\d{3,7})(-|_)\d+/gi,(v)=>v.toUpperCase()],
        ['lat/lon',/\d{1,3}\.\d{4,},\s?\d{1,3}\.\d{4,}/g]
      ]
    }
  },
  computed:{
    text(){return this.sample.trim()},
    items(){
      const {text,matchers}=this;
      if(!text){return []};
      return Object.values(matchers.reduce((items,[label,regexp,modifer=(v)=>(v),options={}])=>{
        const matches=text.match(regexp);
        if(matches?.length){
          for(const match of matches){
            const value=modifer(match);
            items[value]=[label,value,options]
          }
        };
        return items
      },{}));
    },
  },
  methods:{
    onSelect(value=''){
      this.$emit('onSelect',value)
    }
  },
});

Vue.component('AppHeader3',{
  template:`<header name="AppHeader3" class="app-header" style="background:#dddddd;">
     <label for="searchInput" class="app-header__search">
        <IcIcon @click="search" name="search" color="#676767" class="font-size-24px"/>
        <div class="position-relative">
          <input id="searchInput" class="app-header__input" v-model="sample" @keyup.self.enter="search" placeholder="Поиск"/>
          <SearchSuggest :sample="sample" @onSelect="onSelect" class="position-absolute" style="top:36px;"/>
        </div>
        <IcIcon v-if="!!sample" @click="clear" name="close-1" color="#676767" class="font-size-24px margin-left-auto"/>
     </label>
     <div class="app-header__buttons">
        <button-sq @click="$router.push({name:'map'})">
          <IcIcon name="pin-1" color="#676767" class="font-size-24px"/>
        </button-sq>
        <button-sq @click="$emit('toggle-menu')">
          <IcIcon name="menu ic-menu" color="#676767" class="font-size-24px"/>
        </button-sq>
     </div>
  </header>`,
  data:()=>({
    sample:'',
  }),
  methods:{
    search(){
      const text=this.sample.trim();
      if(!text){return};
      const route={name:'search',params:{text}};
      if(this.$route.name==='search') {
        this.$router.replace(route);
      }else{
        this.$router.push(route);
      }
      this.clear();
    },
    clear(){
      this.sample = '';
    },
    onSelect(text){
      this.sample=text;
      this.search();
    }
  },
});

if(app){
  app.$forceUpdate();
};




