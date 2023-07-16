Vue.component('app-header',{
  template:`<div class="display-contents">
    <AppHeader3 v-if="username=='mypanty1'" v-on="$listeners"/>
    <AppHeader2 v-else @toggle-menu="$emit('toggle-menu')"/>
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
          <IcIcon name="search" color="#676767" class="font-size-24px"/>
        </div>
        <input id="searchInput" class="app-header__input" v-model="sample" @keyup.self.enter="search" placeholder="Поиск"/>
        <div v-if="!!sample" @click="clear" class="display-flex justify-content-center align-items-center">
          <IcIcon name="close-1" color="#676767" class="font-size-24px"/>
        </div>
     </label>
     <div class="app-header__buttons">
        <button-sq @click="$router.push({name:'map'})">
          <IcIcon name="pin-1" color="#676767" class="font-size-24px"/>
        </button-sq>
        <button-sq @click="$emit('toggle-menu')">
          <IcIcon name="menu" color="#676767" class="font-size-24px"/>
        </button-sq>
        <button-sq @click="$router.push({name:'favs'})">
          <IcIcon name="BookmarkAdd" color="#676767" class="font-size-24px"/>
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
  },
});

