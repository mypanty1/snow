Vue.component('app-header',{
  template:`<div class="display-contents">
    <AppHeader3 v-if="username=='mypanty1'" v-on="$listeners"/>
    <AppHeader2 v-else v-on="$listeners"/>
  </div>`,
  computed:{
    ...mapGetters({
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

Vue.component('SearchSuggest',{
  template:`<div name="SearchSuggest" style="z-index:40000;">
    <div class="position-relative">
      <div class="display-flex flex-direction-column ymaps-2-1-79-search__suggest">
        <div v-for="([label,item,modifer],key) of items" :key="key" @click="select(item,modifer)" class="ymaps-2-1-79-suggest-item">
          <span class="ymaps-2-1-79-search__suggest-item"><span class="ymaps-2-1-79-search__suggest-highlight">{{label}}: </span>{{item}}</span>
        </div>
      </div>
    </div>
  </div>`,
  props:{
    sample:{type:String,default:''},
  },
  data:()=>({
    matchers:[
      ['СЗ',/1-\d{12}/g],
      ['IP',/(\d{1,3}[бю.,./])(3)\d{1,3}/i,(v)=>v.replace(/[бю.,./]/gi,'.')],
      ['IP',/\d{1,3}[бю.,./]\d{1,3}[бю.,./]\d{1,3}[бю.,./]\d{1,3}/gi,(v)=>v.replace(/[бю.,./]/gi,'.')],
      ['MAC',/[0-9a-f]{2}[:-;_][0-9a-f]{2}[:-;_][0-9a-f]{2}[:-;_][0-9a-f]{2}[:-;_][0-9a-f]{2}[:-;_][0-9a-f]{2}/i,(v)=>v.replace(/[:-;_]/gi,':')],
      ['MAC',/[0-9a-f]{4}[бю.,./][0-9a-f]{4}[бю.,./][0-9a-f]{4}/gi,(v)=>v.replace(/[бю.,./]/gi,'.')],
      ['ЛС',/\d(-|)\d{3}(-|)\d{7}/g],
      ['ЛС',/2\d{11}/g],
      ['CPE',/(S|Q|F|T|3|Z)[\w|\d]{11,14}/g],
      //['ТЛФ',/(+|)(7|8)\d{10}/g,getPhoneWithPlus],
      //['ТЛФ',/(+|)(7|8)-\d{3}-\d{7}/g,getPhoneWithPlus],
      ['PL',/PL_\d{2}_\d{3,8}/gi,(v)=>v.toUpperCase()],//sample.match(/PL_(?<region_id>\d{1,2})_/i)
      ['PL',/\d{19}/g],
      ['УОС',/(гств|пмп|атс|влс|скд|удтс|абк|му|ду|тдчс)(1|0){2}\d{2,8}\D{2,3}(_\d{2})?(-|_)\d{3,5}/g],
      ['Порт',/PORT-([A-ZА]{1,4})(-|_)((\d{2}|\D{2})|(\d{2}\D{2}|\D{2}\d{2})|((\d{2}|\D{2})(-|_)(\d{2}|\D{2})))(-|_)\d{3,7}(-|_)\d{1,3}[/]\d+/gi,(v)=>v.toUpperCase()],
      ['СЭ',/[A-ZА]{1,4}(-|_)((\d{2}|\D{2})|(\d{2}\D{2}|\D{2}\d{2})|((\d{2}|\D{2})(-|_)(\d{2}|\D{2})))(-|_)(\d{3,7})(-|_)\d+/gi,(v)=>v.toUpperCase()],
      ['ШДУ',/(L|CU|ECU)(-|_)((\d{2}|\D{2})|(\d{2}\D{2}|\D{2}\d{2})|((\d{2}|\D{2})(-|_)(\d{2}|\D{2})))(-|_)(\d{3,7})(-|_)\d+/gi,(v)=>v.toUpperCase()],
      ['Pos.',/\d{1,3}\.\d{4,},\s?\d{1,3}\.\d{4,}/]
    ]
  }),
  watch:{
    'items'(items){
      console.log({sample:this.sample,items})
    }
  },
  computed:{
    items(){
      const {sample,matchers}=this;
      return matchers.reduce((items,[label,regexp,modifer])=>{
        const item=sample.match(regexp)?.[0];
        if(item){
          items.push([label,item,modifer]);
        };
        return items
      },[]);
    }
  },
  methods:{
    select(item,modifer=(v)=>(v)){
      this.$emit('onSelect',modifer(item))
    }
  },
});


Vue.component('AppHeader3',{
  template:`<header name="AppHeader3" class="app-header">
     <label for="searchInput" class="app-header__search">
        <div @click="search" class="display-flex justify-content-center align-items-center">
          <IcIcon name="search" color="#676767" class="font-size-24px"/>
        </div>
        <div class="position-relative">
          <input id="searchInput" class="app-header__input" v-model="sample" @keyup.self.enter="search" placeholder="Поиск"/>
          <SearchSuggest @onSelect="onSelect" class="position-absolute" style="top:44px;left:24px;"/>
        </div>
        <div v-if="!!sample" @click="clear" class="display-flex justify-content-center align-items-center">
          <IcIcon name="close-1" color="#676767" class="font-size-24px"/>
        </div>
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



