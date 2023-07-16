Vue.component('app-header',{
  template:`<div class="display-contents">
    <AppHeader3 v-if="username=='mypanty1'"/>
    <AppHeader2 v-else/>
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

Vue.component('AppHeader3',{
  template:`<header name="AppHeader3" class="app-header">
     <label for="searchInput" class="app-header__search">
        <div @click="search" class="display-flex justify-content-center align-items-center">
          <IcIcon name="ic-search" color="#676767" class="font-size-24px"/>
        </div>
        <input id="searchInput" class="app-header__input" v-model="searchText" @keyup.self.enter="search" placeholder="Поиск"/>
        <div v-if="!!searchText" @click="clear" class="display-flex justify-content-center align-items-center">
          <IcIcon name="ic-close-1" color="#676767" class="font-size-24px"/>
        </div>
     </label>
     <div class="app-header__buttons">
        <button-sq @click="toMap">
          <IcIcon name="ic-pin-1" color="#676767" class="font-size-24px"/>
        </button-sq>
        <button-sq @click="toggleMenu">
          <IcIcon name="ic-menu" color="#676767" class="font-size-24px"/>
        </button-sq>
        <button-sq @click="toggleMenu">
          <IcIcon name="far fa-question-circle" color="#676767" class="font-size-24px"/>
        </button-sq>
     </div>
  </header>`,
  data:()=>({
    searchText:'',
  }),
  methods:{
    search(){
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
    toMap(){
      this.$router.push({ name: 'map' });
    },
    clear(){
      this.searchText = '';
    },
  },
});

