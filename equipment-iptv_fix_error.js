//fix error

Vue.component('equipment-iptv', {
  //template: '#equipment-iptv-template',
  template:`<section>
    <div v-if="dmsStatus" class="status" :class="dmsStatusClass"></div>
    <title-main icon="router" :text="status.text" @open="open = !open">
      <button-sq :icon="iptvStatus.status.loading?'loading rotating':'refresh'" @click="refreshData" :disabled="iptvSomeLoading"/>
    </title-main>
    <div class="text-align-center margin-top-4px" :class="isError?'red':'green'">{{ message }}</div>
    <info-value v-if="!iptvData" label="Нет данных STB"/>
    <div v-if="iptvData&&open">
      <info-value v-for="([label,value],key) of info" :key="key" v-bind="{label,value}" with-line />
    </div>
    <div v-if="status.isOn" style="display:grid;gap:4px;grid-template-columns:1fr 1fr 1fr 1fr;">
      <button-main style="grid-area:1/1/2/3;" @click="sendCommand(commands.pinreset)" size="full" label="Сброс PIN-кода" button-style="outlined" :loading="iptvStatus.pinreset.loading" :disabled="iptvSomeLoading"/>
      <button-main style="grid-area:1/3/2/5;" @click="sendCommand(commands.upgrade)" size="full" label="Обновить ПО" button-style="outlined" :loading="iptvStatus.upgrade.loading" :disabled="iptvSomeLoading"/>
      <button-main style="grid-area:2/1/3/5;" @click="sendCommand(commands.reconfig)" size="full" label="Перезапрос конфигурации" button-style="outlined" :loading="iptvStatus.reconfig.loading" :disabled="!iptvSomeLoading"/>
    </div>
  </section>`,
  props: {
    equipment: { type: Object, required: true },
    accountId: { type: String, default: '' },
  },
  data() {
    return {
      dmsStatus:this.equipment.dms_status,
      message: '',
      isError:false,
      open: false,
      iptvStatus: {
        code: { loading: false, btn: 'info', icon: '' },
        status: { loading: false, btn: 'info', icon: '' },
        reboot: { loading: false, btn: 'info', icon: '' },
        pinreset: { loading: false, btn: 'info', icon: '' },
        upgrade: { loading: false, btn: 'info', icon: '' },
        reconfig: { loading: false, btn: 'info', icon: '' },
      },
      commands: {
        status: 'status',
        reboot: 'reboot',
        pinreset: 'pinreset',
        upgrade: 'upgrade',
        reconfig: 'reconfig',
      },
      response: {
        reboot: 'Приставка перезагружается',
        pinreset: 'PIN-код успешно сброшен',
        upgrade: 'Приставка в очереди на обновление',
        reconfig: 'Конфигурация обновлена',
      },
    }
  },
  computed: {
    status() {
      const statusCode = this.dmsStatus && this.dmsStatus.code;
      if (statusCode == 204) return { text: 'Оффлайн', isOn: false };
      const uptime = (this.iptvData && this.iptvData.uptime) || 0;
      const uptimeText = `Онлайн ${Datetools.duration(uptime * 1000)}`
      if (statusCode == 200) return { text: uptimeText, isOn: true };
      return { text: 'Недоступен', isOn: false };
    },
    isAndroid() {
      const dmsType = this.dmsStatus && this.dmsStatus.type;
      return dmsType === 'android';
    },
    iptvData() {
      const status = this.dmsStatus;
      if (status.error) return null;
      return status.info?.info?.AndroidTV_Status||status.info;
    },

    dmsStatusClass() {
      const statusCode = this.dmsStatus && this.dmsStatus.code;
      if (!statusCode) return null;
      return {
        'status-on': this.dmsStatus.code == 200,
        'status-off': this.dmsStatus.code == 204,
      };
    },
    iptvSomeLoading() {
      return Object.values(this.iptvStatus).some((el) => el.loading);
    },
    info(){
      function checkValue(value, postfix = '') {
        const result = `${value || ''} ${postfix}`.trim();
        return value ? result : ' — ';
      }
      const {iptvData,isAndroid}=this;
      return [
        ["Подключение",checkValue(iptvData.connection_type)],
        ["Открытый интерфейс",checkValue(iptvData.open_ui_page)],
        ["Тип контента",checkValue(iptvData.watching_content_type)],
        ["Код контента",checkValue(iptvData.watched_content_code)],
        ["Смотримый канал",checkValue(iptvData.watched_tvchan_name)],
        ["Битрейт контента",checkValue(iptvData.content_bitrate, 'Кбит/с')],
        ["Скорость",checkValue(iptvData.down_bandwidth_number||iptvData.down_bandwidth, 'Кбит/с')],
        ["Мультикаст группа",checkValue(iptvData.multicast_group)],
        ["IP адрес",checkValue(iptvData.ip)],
        ["IP шлюз",checkValue(iptvData.ip_gateway)],
        ["Маска подсети",checkValue(iptvData.ip_mask)],
        ["DNS",checkValue(iptvData.dns1)],
        ["Версия App",`${checkValue(iptvData.app_version_name)||'?'} (${checkValue(iptvData.app_version)||'?'})`],
        ["Версия FW",`${checkValue(iptvData.fw_version_name)||'?'} (${checkValue(iptvData.firmware_version)||'?'})`],
        ...isAndroid?[
          ["ОЗУ занято",`${checkValue(iptvData.ram_usage)} из ${checkValue(iptvData.ram_size)} Мб`],
          ["ПЗУ занято",`${checkValue(iptvData.storage_usage)} из ${checkValue(iptvData.storage_size)} Мб`],
          ["ЦПУ использовано",checkValue(iptvData.cpu_usage, '%')],
        ]:[],
      ]
    },
  },
  methods: {
    async refreshData() {
      this.message = '';
      this.iptvStatus.status.loading = true;
      const response = await this.getRequest(this.commands.status).catch(e => this.catchDMSError(e));
      this.iptvStatus.status.loading = false;
      if (response.code != 200 && response.code != 204) {
        this.catchDMSError(response);
      } else {
        this.isError = false;
        this.message = '';
        this.dmsStatus = response;
      }
    },
    getRequest(command) {
      const serial_number = this.equipment.serial;
      const account = this.accountId
      const url = buildUrl(command, { serial_number, account ,model:this.equipment.model}, '/call/dms/');
      return httpGet(url);
    },
  
    catchDMSSuccess(wasOnline, success) {
      let text = '';
      const inNotSuccess = wasOnline && !success;
      if (inNotSuccess) {
        text = 'Ошибка. Приставка недоступна';
      }
      const isNotOnline = !wasOnline && !success;
      if (isNotOnline) { text = 'Приставка недоступна' }
      this.message = text;
      this.isError = false;
    },
    catchDMSError(response) {
      const code = response.code;
      let text = 'Ошибка STB';
      if (code == 400) text = 'Сервис не поддерживается';//биллинг
      if (code == 403) text = 'Приставка недоступна';
      if (code == 404) text = 'Приставка не найдена';
      if (code == 500) text = 'Ошибка сервиса';
      const noCode = response.type === 'success' && !(response.data && response.data.result_message);
      if (noCode) text = 'Код активации не найден';
      this.message = `(${code}) ${text}`;
      this.isError = true;
    },
    async sendCommand(command) {
      this.message = '';
      this.iptvStatus[command].loading = true;
      this.iptvStatus[command].btn = 'info';
      this.iptvStatus[command].icon = 'fa-sync';
      const response = await this.getRequest(command).catch(e => this.catchDMSError(e));
      this.iptvStatus[command].loading = false;
      if (response.code == '200' && response.data.length > 0) {
        const data = response.data[0];
        const wasOnline = data.was_online;
        const { success } = data.device_report;
        const isSuccess = wasOnline && success;
        if (isSuccess) {
          this.message = this.response[command];
          this.isError = false;
        } else {
          this.catchDMSSuccess(wasOnline, success);
        }
        this.iptvStatus[command].btn = 'success';
        this.iptvStatus[command].icon = 'fa-check';
      } else {
        this.iptvStatus[command].btn = 'danger';
        this.iptvStatus[command].icon = 'fa-times';
        this.catchDMSError(response);
      }
    }
  },
})
;
