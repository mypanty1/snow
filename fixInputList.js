//fix input list option value
Vue.component('input-el', {
  template:`<section class="input-el" :class="sectionClass">
    <label class="input-el__label">
      <slot v-if="focus||value" name="prefix"></slot>
      <div class="input-el__input-wrapper">
        <datalist :id="datalistId">
          <template v-for="(item,key) of items">
            <template v-if="Array.isArray(item)">
              <option :key="key" :label="item[0]" :value="item[1]">{{item[0]}}</option>
            </template>
            <template v-else-if="item?.label||item?.value">
              <option :key="key" :label="item.label" :value="item.value">{{item.label}}</option>
            </template>
            <template v-else>
              <option :key="key" :label="item" :value="item">{{item}}</option>
            </template>
          </template>
        </datalist>
        <input class="input-el__input" :class="inputElClass" v-bind="{value,disabled:disabledOrReadOnly,type,placeholder:focus?placeholder:label,list:datalistId,...$attrs,...inputAttrs}" v-filter="filter" :style="{'background-color':disabled?'#f1f1f1':''}" @focus="focus=true" @blur="focus=false" @input="$emit('input',$event.target.value)"  @keyup.enter="$emit('onKeyUpEnter')">
      </div>
      <span v-show="showLabel && (focus || value)" class="input-el__label-text" :style="{'background-color':disabled?'#f1f1f1':''}">{{label}}</span>
      <slot name="postfix"></slot>
      <div class="input-el__clear" v-show="clearable&&value" @click.stop="clear">
        <span class="fas fa-times"></span>
      </div>
      <slot name="postfix2"></slot>
    </label>
  </section>`,
  props:{
    value:{type:[String,Number],default:''},
    label:{type:[String,Number],default:''},
    showLabel:{type:Boolean,default:true},
    type:{type:String},
    error:{type:Boolean,default:false},
    maxLength:{type:Number,default:null},
    clearable:{type:Boolean,default:false},
    disabled:{type:Boolean,default:false},
    readOnly:{type:Boolean,default:false},
    placeholder:{type:[String,Number],default:''},
    items:{type:Array,default:()=>[]},
    datalistId:{type:[String,Number],default:randcode(20)},
    filter:{type:String,default:''},
    inputClass:{type:[String,Array],default:''},
    inputAttrs:{type:Object,default:null},
  },
  data:()=>({
    focus:false,
  }),
  computed:{
    disabledOrReadOnly(){return this.disabled||this.readOnly},
    sectionClass(){
      return {
        'input-el--focus':this.focus,
        'input-el--filled':this.value,
        'input-el--error':this.error,
        'input-el--disabled':this.disabled,
      };
    },
    inputElClass(){
      return [
        !!this.$slots.prefix&&'input-el__input--prefix',
        !!this.$slots.postfix&&'input-el__input--postfix',
        this.inputClass
      ];
    },
  },
  methods:{
    clear(){
      if(this.disabled){return};
      this.$emit('input','');
    },
  },
});
