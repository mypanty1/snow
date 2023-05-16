Vue.component("traffic-light-ma", {
  //template: "#traffic-light-ma-template",
  template:`<div class="display-contents">
    <message-el v-if="isB2b" text="Данный ЛС принадлежит клиенту B2B. Диагностика не осуществляется." type="info" box class="padding-left-right-16px"/>
    <message-el v-else-if="isTooManyInternetServices" text="На данном ЛС несколько сервисов Интернет. Диагностика не осуществляется." type="info" box class="padding-left-right-16px"/>
    <div v-else class="align-items-center display-flex justify-content-around traffic-light" :class="[test ? 'loading' : status]">
      <div class="align-items-center display-flex margin-left-16px width-100-100" @click="showCheckList()">
          <div v-if="test">Идет диагностика...</div>
          <div v-else :class="{'width-75-100' : count}"><span>{{message}}</span></div>
          <div v-if="count && !test" class="align-items-center count display-flex justify-content-center margin-left-4px">{{count}}</div>
      </div>
      <div v-if="!test" @click="startTest" class="margin-left-auto margin-right-16px" style="font-size: .9rem"> <i class="fas fa-sync-alt"></i> </div>
      <modal-container ref='modal'>
        <traffic-light-modal 
          :checkList='checkList' 
          :billingType='billingType'
          :forisAccount='forisAccount'
          :forisResources='forisResources'
          :lbsvAccount='lbsvAccount'
          :accountId='accountId'
          :equipments='equipments'
          @restart='startTest'
          @update:online-session='$emit("update:online-session")'
        />
      </modal-container>
    </div>
  </div>`,
  props: {
    accountDevice: { type: Object, default: () => null },
    billingType: { type: String, default: "lbsv" }, // lbsv,foris
    forisAccount: { type: Object, default: () => null },
    forisResources: { type: Object, default: () => null },
    lbsvAccount: { type: Object, default: () => null },
    accountId: { type: String, default: "" },
    equipments: { type: Array, default: () => [] },
    isB2b:Boolean,
    isTooManyInternetServices:Boolean
  },
  data() {
    return {
      status: "", // green-light orange-light red-light error
      message: "Идет диагностика...",
      count: 0,
      portStatus: null,
      lastMac: "",
      attachedMac: "",
      macs: {
        last: Array,
        attached: Array,
      },
      checkList: [],
      test: false,
      sessions: [],
    };
  },
  created() {
    if(this.isB2b||this.isTooManyInternetServices){return};
    this.startTest();
  },
  computed: {
    hasInternet() {
      const types = {
        lbsv: () =>
          this.lbsvAccount.vgroups.some(
            (s) => s.userid == this.lbsvAccount.userid && s.type == "internet"
          ),
        foris: () =>
          this.forisResources.internet.filter(
            (service) => service.login && service.login.login
          ).length > 0,
      };
      return types[this.billingType]();
    },
    isBlocked() {
      const types = {
        lbsv: () => {
          return !this.lbsvAccount.vgroups.some((s) => {
            return (
              s.userid == this.lbsvAccount.userid &&
              s.isSession &&
              (s.status == "0" || (s.billing_type == 4 && s.status == "12"))
            );
          });
        },
        foris: () =>
          this.forisResources.internet.every(
            (service) => service.blocks_status
          ),
      };
      return types[this.billingType]();
    },
    activeSessions() {
      if (!Array.isArray(this.sessions)) return [];
      return this.sessions.filter((el) => {
        const hasInfo = Boolean(el.data && el.data.length);
        if (!hasInfo) return false;
        return !!el.data[0].start;
      });
    },
    deviceRequestParams() {
      return {
        MR_ID: this.accountDevice.region.mr_id,
        DEVICE_IP_ADDRESS: this.accountDevice.device.ip,
        DEVICE_SYSTEM_OBJECT_ID: this.accountDevice.device.system_object_id,
        DEVICE_VENDOR: this.accountDevice.device.vendor,
        DEVICE_FIRMWARE: this.accountDevice.device.firmware,
        DEVICE_FIRMWARE_REVISION: this.accountDevice.device.firmware_revision,
        DEVICE_PATCH_VERSION: this.accountDevice.device.patch_version,
        SNMP_PORT_NAME: this.accountDevice.port.snmp_name,
      };
    },
  },
  methods: {
    startTest() {
      if(this.isB2b||this.isTooManyInternetServices){return};
      if (this.test) return;
      this.test = true;
      this.status = "loading";
      this.count = 0;
      this.message = "Идет диагностика...";
      this.checkList = [];
      this.portStatus = null;
      this.lastMac = "";
      this.macs.last = [];
      if (!this.accountDevice || !this.accountDevice.port.snmp_number) {
        this.result(
          "Не удалось продиагностировать, не найден порт подключения",
          "error"
        );
        return;
      }
      if (!this.hasInternet) {
        this.result("Не удалось продиагностировать, нет услуг ШПД", "error");
        return;
      }
      if (this.isBlocked) {
        this.result("Услуги ШПД заблокированы", "error");
        return;
      }
      this.pingDevice();
    },
    async pingDevice() {
      const params = {
        MR_ID: this.accountDevice.region.mr_id,
        IP_ADDRESS: this.accountDevice.device.ip,
        SYSTEM_OBJECT_ID:null,
        VENDOR:null
      };
      const response = await httpPost(
        "/call/hdm/device_ping",
        { device: params },
        true
      );
      if (response.code != "200") {
        this.result("Коммутатор недоступен", "red-light");
        return;
      }
      this.result("Коммутатор доступен");
      this.getPortStatus();
    },
    async getPortStatus() {
      const params = {
        device: this.accountDevice.port.device_name,
        //ipaddress:this.accountDevice.device.ip,
        //mr_id:this.accountDevice.region.mr_id,
        //snmp_version:'',
        //snmp_community:'',
        port_ifindex: this.accountDevice.port.snmp_number,
      };
      const response = await httpGet(
        buildUrl("port_status_by_ifindex", params, "/call/hdm/"),
        false
      );
      if (response.type === "error") {
        this.result(response.text, "red-light");
        return;
      }
      this.portStatus = response;
      if (!response.IF_ADMIN_STATUS) {
        this.result('Административный статус порта "Отключен"', "orange-light");
      } else {
        this.result('Административный статус порта "Включен"');
      }
      this.getLoopback();
    },
    async getLoopback() {
      const params = this.deviceRequestParams;
      const response = await httpPost(
        "/call/hdm/port_info_loopback",
        params,
        true
      );
      if (response.type === "error") {
        this.result(response.text, "orange-light");
        this.checkErrors();
        return;
      }
      if (response.detected) {
        this.result(response.description, "red-light");
        if (!this.portStatus.IF_OPER_STATUS) {
          this.result("Нет линка", "orange-light");
        }
        return;
      }
      this.result(response.description);
      
      /*if (this.isB2b||this.isTooManyInternetServices) {
        this.result("Не удалось продиагностировать, слишком много услуг", "error");
        return;
      }*/
      this.checkSessionAndLink();
    },
    async checkSessionAndLink() {
      await this.getAllOnlineSessions();

      if (!this.portStatus.IF_OPER_STATUS) {
        this.result("Нет линка", "orange-light");

        if (!this.activeSessions.length) {
          this.result("Нет сессии");
          this.testCable();
          return;
        }

        if (this.activeSessions.length > 1) {
          this.result("Обнаружено больше одной активной сессии", "red-light");
          return;
        } else if (this.activeSessions[0].data.length === 1) {
          const success = await this.resetSession(this.activeSessions[0]);
          if (!success) return;
        }
      } else if (!this.activeSessions.find((s) => s.data.length > 0)) {
        this.result("Линк есть, нет сессии ", "orange-light");
        this.checkLoginPass();
      }
      this.checkErrors();
    },
    async resetSession(session) {
      session.params.sessionid = session.data[0].sessionid;
      session.params.nasip = session.data[0].nas;
      session.params.dbsessid = session.data[0].dbsessid;
      session.params.descr = session.data[0].descr;
      await httpPost("/call/aaa/stop_session_radius", session.params, true);
      const response = await this.getOnlineSession(session.params, session);
      if (response && response.data.length !== 0) {
        this.result("Сессия не сбросилась", "red-light");
        return false;
      } else {
        this.result("Сброс сессии прошел успешно");
        this.testCable();
        return true;
      }
    },
    async getAllOnlineSessions() {
      this.sessions = [];
      const types = {
        lbsv: () => {
          const sessionParams = [];
          const parseAccount = (account) => String(account).replace(/-/g, "");
          const agreement = this.lbsvAccount.agreements.find(
            (a) => parseAccount(a.account) == parseAccount(this.accountId)
          );
          if (!agreement) return [];
          if (
            this.lbsvAccount.type == 1 &&
            agreement.services.internet.vgroups > 1
          )
            return [];
          agreement.services.internet.vgroups.forEach((service) => {
            if (!service.isSession || service.status == 10) return;
            sessionParams.push({
              login: service.login,
              serverid: service.serverid,
              vgid: service.vgid,
              agentid: service.agentid,
              descr: service.descr,
            });
          });
          return sessionParams;
        },
        foris: () => {
          return this.forisResources.internet
            .filter((service) => service.login && service.login.login)
            .map((service) => ({
              login: service.login.login,
              serverid: this.forisAccount.serverid,
              vgid: service.msisdn,
              descr: "xrad",
            }));
        },
      };
      const currentParams = types[this.billingType]();
      const requests = currentParams.map((params) => {
        const url = buildUrl("get_online_sessions", params, "/call/aaa/");
        return new Promise((resolve) => {
          const session = { params };
          CustomRequest.get(url)
            .then((response) => {
              if (response.code == 200) {
                Object.assign(session, response);
                resolve(session);
              } else {
                console.error("Get online sessions: ", response);
              }
              resolve(session);
            })
            .catch((error) => {
              console.error("Get online sessions: ", error);
              resolve(session);
            });
        });
      });
      if (this.lbsvAccount && this.lbsvAccount.type == 1) return; // FIXME временное решение для b2b клиентов
      this.sessions = await Promise.all(requests);
    },
    async getOnlineSession(params, session) {
      const response = await httpPost(
        "/call/aaa/get_online_sessions",
        params,
        true
      );
      if (response.code == "200") {
        session = response.data;
        session.params = params;
        return response;
      } else {
        console.error("Get online sessions: ", response);
        return null;
      }
    },
    async checkLoginPass() {
      const authType = await this.getAuthType();
      if (authType && authType.toLowerCase() === "pppoe") {
        const errorMessage = await this.loadAuthLog();
        if (errorMessage)
          this.result(errorMessage, "orange-light", this.lbsvAccount);
        else this.result("Логин и пароль верны");
      }
    },
    async loadAuthLog() {
      const session = this.activeSessions[0] || this.sessions[0];
      if (!session) return;
      const { login, serverid, vgid, descr } = session.params;
      const formatDate = (date) =>
        date.toLocaleDateString().split(".").reverse().join("-");
      const params = {
        login,
        serverid,
        vgid,
        descr,
        date: formatDate(new Date()),
      };
      try {
        const response = await httpGet(
          buildUrl("get_radius_log", params, "/call/aaa/")
        );
        if (response.rows.length == 0) return null;
        const errorMessages = {
          10: "неверный логин или пароль",
          11: "неверный логин",
          14: "неверный пароль",
        };
        const lastLogType = response.rows[0].authlog_type;
        return errorMessages[lastLogType] || null;
      } catch (error) {
        console.error(error);
      }
    },
    async getAuthType() {
      const params = this.getParams();
      if (!params) return;
      const exisdData = (response) =>
        response.code == "200" && response.data && response.data.length > 0;

      try {
        const response = await httpGet(
          buildUrl("get_auth_type", params, "/call/aaa/"),
          true
        );
        if (exisdData(response) && response.data[0].auth_type) {
          return response.data[0].auth_type;
        }
      } catch (error) {
        console.error("getAuthType", error);
      }
    },
    getParams() {
      const parseAccount = (account) => String(account).replace(/-/g, "");
      const agreement = this.lbsvAccount.agreements.find(
        (a) => parseAccount(a.account) == parseAccount(this.accountId)
      );
      const types = {
        lbsv: () => {
          if (!agreement) return;
          const service = agreement.services.internet.vgroups.find(
            (service) =>
              service.agrmid === agreement.agrmid &&
              service.isSession &&
              [2, 4, 6].includes(Number(service.agenttype))
          );
          if (!service) return;
          const { login, serverid, vgid } = service;
          return { login, serverid, vgid };
        },
        foris: () => {
          const service = this.forisResources.internet.find(
            (service) => service.login && service.login.login
          );
          return {
            login: service.login.login,
            vgid: service.msisdn,
            serverid: account.serverid,
          };
        },
      };
      return types[this.billingType]();
    },
    testCable() {
      const params = this.deviceRequestParams;
      httpPost("/call/hdm/port_cable_test", params, true).then((data) => {
        const cableLen = [];
        data.text.forEach((t) => {
          /\d+/.test(t) ? cableLen.push(+t.match(/\d+/)) : null;
        });
        cableLen.sort();
        if (cableLen[cableLen.length - 1] - cableLen[0] > 5) {
          this.result(
            "Расхождение в длине пар кабеля, превышающее 5 метров",
            "red-light"
          );
          return;
        }
        if (cableLen[cableLen.length - 1] == 0) {
          this.result("Кабель не обнаружен", "red-light");
          return;
        }
        if (
          !this.portStatus.IF_OPER_STATUS &&
          this.activeSessions[0] &&
          this.activeSessions[0].data.length == 0
        ) {
          this.result(
            "Линка нет, сессии нет, кабель-тест пройден успешно",
            "red-light"
          );
        }
        this.result("Кабель-тест пройден успешно");
        this.checkErrors();
      });
    },
    checkErrors() {
      const errors = parseInt(this.portStatus.IF_IN_ERRORS, 10);
      if (errors > 1000) {
        this.result(`Входящих ошибок на порту ${errors}`, "red-light");
        return;
      } else if (errors > 100) {
        this.result(`Входящих ошибок на порту ${errors}`, "orange-light");
      } else {
        this.result(`Входящих ошибок на порту ${errors}`);
      }
      this.checkSpeed();
    },
    checkSpeed() {
      if (this.portStatus.IF_OPER_STATUS) {
        if (parseInt(this.portStatus.IF_SPEED) == 10) {
          this.result(
            `Скорость порта ${this.portStatus.IF_SPEED}`,
            "orange-light"
          );
        } else {
          this.result(`Скорость порта ${this.portStatus.IF_SPEED}`);
        }
      }
      this.getMac();
      this.loadLastMac();
    },
    getMac() {
      let service =
        this.lbsvAccount &&
        this.lbsvAccount.vgroups.find((s) =>
          [2, 5, 7, 9].includes(s.type_of_bind)
        );
      if (!service) {
        if (this.activeSessions.length > 0 && this.activeSessions[0].data[0]) {
          this.attachedMac =
            this.activeSessions[0].data[0].mac || "0000.0000.0000";
          if (this.activeSessions[0].data[0].mac)
            this.macs.attached = [this.activeSessions[0].data[0].mac];
          this.compareMac();
        } else {
          this.loadHistorySession();
        }
        return;
      }
      if (service.type_of_bind == 7) {
        let mac = service.login.split(":")[0];
        const success = mac.match(/[0-9a-fA-F\.]{14}/g);
        if (success) this.macs.attached = [mac];
        this.attachedMac = success ? mac : "Не удалось получить MAC";
      }
      let params = {
        serverid: service.serverid,
        vgid: service.vgid,
      };
      httpGet(buildUrl("get_mac", params, "/call/service_mix/"), true).then(
        (data) => {
          this.macs.attached = [];
          if (data.isError) {
            this.result(data.message, "orange-light");
            this.attachedMac = "error";
          } else {
            this.macs.attached = data.Data;
            this.attachedMac = (data.Data && data.Data[0]) || "0000.0000.0000";
          }
          this.compareMac();
        }
      );
    },
    async loadHistorySession() {
      if (!this.activeSessions[0] && !this.sessions[0])
        await this.getAllOnlineSessions();
      let session = this.activeSessions[0] || this.sessions[0];
      const { login, serverid, vgid, descr } = session.params;
      const params = {
        login,
        serverid,
        vgid,
        descr,
        dtfrom: new Date(),
        dtto: Dt.addDays(-30),
      };
      httpGet(buildUrl("get_sessions", params, "/call/aaa/"), true).then(
        (data) => {
          this.macs.attached = [];
          if (data.type == "error" || data.type == "warning") {
            this.attachedMac = "0000.0000.0000";
          } else if (data.rows.length > 0) {
            this.attachedMac = data.rows[0].mac;
            data.rows.forEach((sessions) =>
              this.macs.attached.push(sessions.mac)
            );
            this.compareMac();
          } else {
            this.attachedMac = "0000.0000.0000";
          }
          this.compareMac();
        }
      );
    },
    loadLastMac() {
      let params = this.deviceRequestParams;
      params.type = "array";
      httpGet(buildUrl("port_mac_show", params, "/call/hdm/"), true).then(
        (data) => {
          if (data.type == "error") {
            this.result(data.text, "red-light");
            return;
          }
          if (data.text[0] == "Не удалось получить MAC из биллинга") {
            this.result(data.text[0], "red-light");
            return;
          }
          this.macs.last = data.text;
          this.lastMac = data.text[0];
          this.compareMac();
        }
      );
    },
    compareMac() {
      if (!this.lastMac || !this.attachedMac) return;
      if (this.attachedMac == "0000.0000.0000") {
        this.result(`Последний MAC на порту: ${this.lastMac}`);
        this.result("Проблем не обнаружено", "green-light");
        this.test = false;
        return;
      }
      if (this.attachedMac == "error") {
        this.result(`Последний MAC на порту: ${this.lastMac}`);
        this.test = false;
        return;
      }
      this.macs.attached = this.macs.attached.map((a) => a.toLowerCase());
      const last = this.macs.last[this.macs.last.length - 1];
      const successEqual = this.macs.last.some((l) =>
        this.macs.attached.includes(l.toLowerCase())
      );
      if (successEqual) {
        this.result(
          `Последний MAC на порту: ${last};\nMAC в биллинге: ${last}`
        );
        this.result("Проблем не обнаружено", "green-light");
      } else {
        this.result(
          `Последний MAC на порту: ${this.lastMac};\nданный MAC не зарегистрирован в биллинге.`,
          "orange-light",
          {
            last: this.LastMac,
            attached: this.attachedMac,
            account: this.account,
          }
        );
      }
      this.test = false;
    },
    showCheckList() {
      this.$refs.modal.open();
    },
    result(text, status, data = null) {
      if (status == "green-light" && this.status == "loading") {
        this.message = text;
        this.test = false;
        this.status = status;
        return;
      }
      if (status == "orange-light" || status == "red-light") {
        this.status = status;
        this.count++;
        this.message = text;
      }
      if (status == "red-light" || status == "error") {
        this.status = status;
        this.message = text;
        this.test = false;
      }
      if (status !== "green-light") {
        this.checkList.push({
          text: text,
          status: status,
          data: data,
        });
      }
    },
  },
});
Vue.component("lbsv-services",{
  //template:"#lbsv-services-template",
  template:`<div name="lbsv-services">
    <CardBlock v-for="(group, key) in groupServiceList" :key="key" class="mini-card margin-top-0">
      <services-header @open="opened[key] = !opened[key]" :open="opened[key]" :type="key" />
      <div v-show="opened[key]">
        <CardBlock v-if="key==='internet'">
          <traffic-light-ma v-if="account&&!loadingCp&&cp&&!isGpon" 
            billing-type="lbsv" 
            :lbsv-account="account" 
            :account-device="cp" 
            :account-id="accountId"
            :equipments="group.equipments"
            @update:online-session="refreshOnlineSessions"
            :isB2b="isB2b"
            :isTooManyInternetServices="isTooManyInternetServices"
          />
          <template v-if="cp">
            
            <template v-if="isGpon">
              <title-main text="Порт OLT" @open="show.serveOltPort=!show.serveOltPort">
                <button-sq v-if="loading.networkElement" icon="loading rotating"/>
              </title-main>
              <device-info v-if="networkElement&&show.serveOltPort" :networkElement="networkElement" :ports="[cpServePort]" hideEntrances showLocation addBorder autoSysInfo class="padding-top-bottom-8px margin-left-right-16px"/>
              
              <title-main text="Абонентский ONT" @open="show.abonOnt=!show.abonOnt">
                <button-sq v-if="loading.onts" icon="loading rotating"/>
              </title-main>
              <OntInfo v-if="abonOnt&&show.abonOnt&&!loading.onts" :ont="abonOnt" :port="cpServePort" class="margin-bottom-0"/>
              <message-el v-if="!loading.onts&&!abonOnt" text="терминал абонента не найден" type="warn" box/>
            </template>

            <template v-else>
              <title-main text="Порт подключения">
                <button-sq v-if="loading.networkElement" icon="loading rotating"/>
              </title-main>
              <device-info v-if="networkElement" :networkElement="networkElement" :ports="[cpServePort]" hideEntrances showLocation addBorder autoSysInfo class="padding-top-bottom-8px margin-left-right-16px"/>
            </template>
            
          </template>
        </CardBlock>
        <sessions v-if="key=='internet'&&!isB2b" billing-type="lbsv" :lbsv-services="group.services" ref="sessions" :isTooManyInternetServices="isTooManyInternetServices"/>
        <!-- // FIXME временное решение для b2b клиентов -->
        <title-main v-if="key=='internet'&&isB2b" text="Данный ЛС принадлежит клиенту B2B. Запрос сессий не осуществляется." text-size="medium"/>
        <!-- // FIXME временное решение для b2b клиентов-->
        <lbsv-services-el class="margin-top-8px" :mr_id="mr_id" :account="account" :services="group.services" :account-number="accountId" :isB2b="isB2b" :isTooManyInternetServices="isTooManyInternetServices"/>
        <!--оборудование которое не смапилось с услугой в lbsv-account-content-->
        <equipment v-for="(equipment,i) of group.equipments" :key="i" :equipment="equipment" :mr_id="mr_id" :account="accountIdAgreement" :services="group.services"/>
      </div>
    </CardBlock>
  </div>`,
  props:{
    account:{type:Object,required:true},
    mr_id:{type:Number},
    cp:{type:Object,default:null},
    groupServiceList:{type:Object,required:true},
    accountId:{type:String,default:''},
    loadingCp:{type:Boolean,default:false},
  },
  data:()=>({
    opened:{
      internet: true,
      analogtv: true,
      digittv:  true,
      iptv:     true,
      phone:    true,
      hybrid:   true,
      other:    true,
    },
    show:{
      serveOltPort:true,
      abonOnt:true,
    },
    loading:{
      networkElement:false,
      onts:false,
    },
    onts:[],
    networkElement:null,
  }),
  watch:{
    'cp'(cp){
      if(!cp){return};
      if(!cp?.device?.uzel){
        this.getNetworkElement();
      }else{//адаптер cp
        this.networkElement=cp.device;
      };
      if(this.isGpon){
        this.getAuthOnts();
      };
    },
  },
  computed:{
    isB2b(){ // FIXME временное решение для b2b клиентов
      return this.account.type==1;
    },
    isTooManyInternetServices(){
      return this.groupServiceList?.internet?.services?.length>2;
    },
    accountIdAgreement(){
      const parseAccount = (account) => String(account).replace(/-/g, "");
      const agreement = this.account.agreements.find((a) => parseAccount(a.account) == parseAccount(this.accountId));
      return agreement && agreement.account ? agreement.account : this.accountId
    },
    isGpon(){
      if(!this.cp?.port){return};
      return this.cp.port?.name.startsWith('PORT-OLT');
    },
    cpServePort(){
      if(!this.cp?.port){return}
      return {
        device_name:this.cp.port.device_name,
        port_name:this.cp.port.name,
        if_index:this.cp.port.snmp_number,
        if_name:this.cp.port.snmp_name,
        if_alias:this.cp.port.snmp_description,
      }
    },
    abonOnt(){//терминал абонента по маку cp, или по серийнику если неполучилось по маку
      const mac=this.cp?.port?.subscriber_list?.mac||this.cp?.port?.subscriber_list?.[0]?.mac||''
      if(!mac){return};
      const cp_mac=mac.match(/[0-9A-Fa-f]/g).join('').toLowerCase();
      return this.onts.find(ont=>ont.macOnu&&cp_mac===ont.macOnu.match(/[0-9A-Fa-f]/g).join('').toLowerCase())||this.onts.find(ont=>ont.serialNum&&cp_mac.slice(6,12)===(parseInt(ont.serialNum.slice(6,12),16)+3).toString(16).toLowerCase())
    },
  },
  methods:{
    async getNetworkElement(){
      if(!this.cp?.device?.name){return};
      if(this.networkElement){return};
      this.loading.networkElement=true;
      this.networkElement=null;
      const {name=''}=this.cp.device;
      const cache=this.$cache.getItem(`device/${name}`);
      if(cache){
        this.networkElement=cache;
      }else{
        try{
          let response=await httpGet(buildUrl('search_ma',{pattern:name,component:'lbsv-services'},'/call/v1/search/'));
          if(response.data){
            this.$cache.setItem(`device/${name}`,response.data);
            this.networkElement=response.data;
          };
        }catch(error){
          console.warn('search_ma:device.error',error);
        };
      };
      this.loading.networkElement=false;
    },
    async getAuthOnts(){
      if(!this.cp?.device?.name){return};
      if(!this.cp?.port){return};
      if(this.onts.length){return};
      this.loading.onts=true;
      this.onts=[];
      const {device:{name:device_name},port:{snmp_name:port,snmp_number:port_index}}=this.cp;
      try{
        const onts=await httpGet(buildUrl('onu_info',{device_name,port,port_index,component:'lbsv-services'},'/call/hdm/'));
        this.onts=onts.length?onts:[];
      }catch(error){
        console.warn('onu_info.error', error);
      };
      this.loading.onts=false;
    },
    refreshOnlineSessions(){
      if(!this.$refs.sessons){return};
      setTimeout(this.$refs.sessons.refreshSessions,REFRESH_SESSIONS_TIMEOUT);
    }
  }
});
Vue.component('sessions', {
  template:`<CardBlock name="sessions" class="padding-bottom-8px bg-white">
    <title-main text="Сессия">
      <button-sq icon="refresh" @click="refreshSessions"/>
    </title-main>
    <SessionHelpModal ref="SessionHelpModal"/>
    <div class="display-flex flex-direction-column">
      <template v-for="(params,index) of servicesParams">
        <devider-line v-if="index"/>
        <SessionItem :params="params" ref="SessionItem" :key="params.vgid" :isTooManyInternetServices="isTooManyInternetServices"/>
      </template> 
    </div>
  </CardBlock>`,
  props: {
    lbsvServices: { type: Array, default: () => [] },
    forisInternetServices: { type: Array, default: () => [] },
    forisAccount: { type: Object, default: () => ({}) },
    billingType: {
      type: String, 
      default: 'lbsv', // lbsv foris
      validator: (val) => ['lbsv', 'foris'].includes(val)
    },
    isTooManyInternetServices:{type:Boolean,default:false}
  },
  computed: {
    servicesParams() {
      const paramsFn = {
        'lbsv': this.getLbsvParams,
        'foris': this.getForisParams
      }
      return paramsFn[this.billingType]
    },
    getLbsvParams() {
      if(this.billingType != 'lbsv') return []
      //if(this.lbsvServices.length>2){return []}
      return this.lbsvServices
        .filter(service => service.isSession && service.status != 10)
        .map(service => ({
          login: service.login,
          serverid: service.serverid,
          vgid: service.vgid,
          agentid: service.agentid,
          descr: service.descr,//descr 2000000721940
        }))
    },
    getForisParams() {
      if(this.billingType != 'foris') return []
      return this.forisInternetServices
        .filter(service => service.login && service.login.login)
        .map(service => ({
          login: service.login.login,
          serverid: this.forisAccount.serverid,
          vgid: service.msisdn,
          descr: 'xrad'
        }))
    }
  },
  methods: {
    sessionHelp() { 
      this.$refs.SessionHelpModal.open() 
    },
    async refreshSessions() {
      if (!this.$refs.SessionItem) return;
      for(let component of this.$refs.SessionItem){
        await component.getOnlineSession();
      }
      await new Promise(r=>setTimeout(r,2222))
      //this.$refs.sessions.forEach(component => component.getOnlineSession() )
    },
  }
});
Vue.component('SessionItem',{
  template:`<section name="SessionItem">
    <title-main v-bind="titleProps" textClass="font--13-500" class="margin-top-bottom--8px"/>
    <loader-bootstrap v-if="loads.get_online_sessions" text="получение сессии абонента"/>
    <loader-bootstrap v-else-if="loads.stop_session_radius" text="сброс сессии абонента"/>
    <div v-else-if="session" class="margin-left-16px margin-right-16px display-flex flex-direction-column gap-4px">
      <message-el v-if="isError" :text="errorText" type="warn" box/>
      <template v-else>
        <message-el :text="!start?'Оффлайн':('Онлайн c '+(startLocal||start))" :type="!start?'warn':'success'" box/>
        <div v-if="sessionid" class="display-flex align-items-center justify-content-center">
          <span class="font-size-12px">{{sessionid}}</span>
        </div>
        
        <div class="display-flex flex-direction-column">
          <info-value v-if="ip" label="IP" :value="ip" withLine class="padding-unset" data-ic-test="session_ip"/>
          <info-value v-if="macIsValid" label="MAC" :value="mac" withLine class="padding-unset" data-ic-test="session_mac"/>
          <info-text-sec v-if="macVendor" :text="macVendor" class="padding-unset text-align-right"/>
          <info-value v-if="port" label="Порт" :value="agent_circuit_id" withLine class="padding-unset"/>
          <info-value v-if="device" label="Коммутатор" :value="agent_remote_id" withLine class="padding-unset"/>
          <info-text-sec v-if="deviceMacVendor" :text="deviceMacVendor" class="padding-unset text-align-right"/>
          <info-value v-if="nas" label="BRAS" :value="nas" withLine class="padding-unset" data-ic-test="session_nas"/>
        </div>
        <div class="display-flex justify-content-space-between gap-4px margin-bottom-8px">
          <button-main @click="$refs.SessionHistoryModal.open()" button-style="outlined" :disabled="false" icon="history" label="История" loading-text="" size="large" data-ic-test="session_history_btn" />
          <button-main @click="stop_session_radius" button-style="outlined" :disabled="!start" icon="refresh" label="Сброс" loading-text="" size="large" data-ic-test="session_reset_btn" />
          <button-main @click="$refs.SessionLogsModal.open()" button-style="outlined" :disabled="false" icon="log" label="Логи" loading-text="" size="large" data-ic-test="session_logs_btn" />
        </div>
        
        <SessionHistoryModal ref="SessionHistoryModal" :session="session" :params="params"/>
        <SessionLogsModal ref="SessionLogsModal" :session="session" :params="params"/>
      </template>
    </div>
    <div v-else-if="isTooManyInternetServices" class="margin-left-16px margin-right-16px">
      <message-el text="сессия не была запрошена" type="info" box/>
    </div>
  </section>`,
  props:{
    params:{type:Object,required:true},
    isTooManyInternetServices:{type:Boolean,default:false},
  },
  data:()=>({
    resps:{
      get_online_sessions:null,
      stop_session_radius:null
    },
    loads:{
      get_online_sessions:false,
      stop_session_radius:false
    },
    ouis:{},
  }),
  watch:{
    'mac'(mac){
      if(mac&&this.macIsValid){this.getMacVendorLookup(mac)};
    },
    'deviceMac'(deviceMac){
      if(deviceMac){this.getMacVendorLookup(deviceMac)};
    },
  },
  created(){ 
    if(this.isTooManyInternetServices){return };
    this.get_online_sessions() 
  },
  computed:{
    titleProps(){
      const {serverid,agentid,vgid,login,descr}=this.params;
      const service_hash=atok(...[serverid,vgid,agentid].filter(v=>v));
      if(!login){return {text:service_hash}};
      return {text:login,text2:service_hash}
    },
    loading(){return Object.values(this.loads).some(v=>v)},
    session(){return this.resps.get_online_sessions?.data?.[0]||this.resps.get_online_sessions},
    isError(){return this.session?.isError},
    errorText(){return this.session?.message||'Error: unknown'},
    device(){return this.session?.device||''},
    deviceStr(){return `${this.device||''}`},
    deviceMac(){return ((this.deviceStr.match(/^[a-f0-9]{12}$/gi)?.[0]||'').match(/.{4}/gi)||[]).join('.')},
    agent_remote_id(){
      const {deviceStr,deviceMac}=this;
      if(deviceMac){//30150037478 - default format
        return deviceMac;
      };
      const isNotHex=/\W/i.test(deviceStr);
      if(isNotHex){//10702046999 - ascii format
        return deviceStr
      };
      return (deviceStr.match(/.{2}/gi)||[]).map(b=>{
        b=b.padStart(2,0);
        try{//60910533888 - custom format
          return unescape('%'+b);
        }catch(error){
          return b
        };
      }).join('');
    },
    ip(){return this.session?.ip||''},
    mac(){return this.session?.mac||''},
    nas(){return this.session?.nas||''},
    port(){return this.session?.port||''},
    agent_circuit_id(){return `${this.port||''}`},//40206334997
    sessionid(){return this.session?.sessionid||''},
    start(){return this.session?.start||''},
    startLocal(){return this.start;return (!this.start||!Date.prototype.toDateTimeString)?'':new Date(Date.parse(`${this.start} GMT+0300`)).toDateTimeString()},
    macIsValid(){return this.mac&&this.mac!=='0000.0000.0000'},
    macVendor(){return this.ouis[this.mac]},
    deviceMacVendor(){return this.ouis[this.deviceMac]},
  },
  methods:{
    async get_online_sessions(){
      if(this.loads.get_online_sessions){return};
      this.resps.get_online_sessions=null;
      this.loads.get_online_sessions=true;
      const {serverid,agentid,vgid,login,descr}=this.params;//descr 2000000721940
      try{
        const response=await httpGet(buildUrl('get_online_sessions',{serverid,agentid,vgid,login,descr:/xrad/i.test(descr)?'xrad':''},'/call/aaa/'))
        this.resps.get_online_sessions=response;
      }catch(error){
        console.warn("get_online_sessions.error",error);
        this.resps.get_online_sessions={data:[{isError:true,message:'Error: unexpected'}]};
      };
      this.loads.get_online_sessions=false;
    },
    async stop_session_radius(){
      if(this.loads.stop_session_radius){return};
      this.resps.stop_session_radius=null;
      this.loads.stop_session_radius=true;
      const {serverid,agentid,vgid,login,descr}=this.params;//descr 2000000721940
      const {sessionid,dbsessid,nas}=this.session;
      try{
        const response=await httpGet(buildUrl('stop_session_radius',{serverid,agentid,vgid,login,descr:/xrad/i.test(descr)?'xrad':'',sessionid,dbsessid,nasip:nas},'/call/aaa/'));
        if(response.message=='OK'){
          this.resps.get_online_sessions=null;
          setTimeout(this.get_online_sessions,10000);
        };
        this.resps.stop_session_radius=response;
      }catch(error){
        console.warn("stop_session_radius.error",error);
      };
      this.loads.stop_session_radius=false;
    },
    async getOnlineSession(){//public
      return await this.get_online_sessions()
    },
    async getMacVendorLookup(mac=''){
      if(!mac){return};
      const ouis=await this.test_getMacVendorLookup([mac]);
      this.ouis={...this.ouis,...ouis};
    },
  }
});
Vue.component("LbsvService",{
  template:`<section name="LbsvService">
    <title-main textClass="font--13-500" :text="typeService" :text2="service.statusname" :text2Class="stateClass" :textSub="service.agentdescr" textSubClass="tone-500 font--12-400">
      <span slot="icon" class="ic-20" :class="['ic-'+icon,stateClass]"></span>
      <button-sq v-if="service.type=='internet'" :icon="loading.get_user_rate?'loading rotating':(user_rate&&user_rate.length&&!user_rate[0].isError)?'info':'warning tone-300'" type="large" @click="testAndOpenModalOrLoadInfo"/>
    </title-main>
    <billing-info-modal ref="billing_info_modal" :billing-info="[user_rate||[]]" :loading="loading.get_user_rate"/>
    
    <title-main textClass="tone-500 font--12-400" :text="service.tarif||service.tardescr" textSubClass="font--13-500" textSub1Class="tone-500" :textSub="auth_type||rate" :textSub2="auth_type?rate:''" :style="(auth_type||rate)?'':'margin:-10px 0px;'">
      <button-sq :icon="(loading.get_auth_type||loading.get_user_rate)?'loading rotating':''" type="medium"/>
    </title-main>
    
    <div class="margin-left-right-16px" style="display:grid;gap:4px;grid-template-columns:1fr 1fr 1fr 1fr;">
      <lbsv-login-pass v-if="serviceHasPassword" :service="service" :billingid="account.billingid" style="grid-area: 1/1/2/5;"/>
      <title-main v-else textClass="font--16-500" :text1Class="[1,4,5,6].includes(service.billing_type)?'':'tone-500'" :text2Class="[2,3].includes(service.billing_type)?'':'tone-500'" :text="service.login||service.vgid" :text2="service.login?service.vgid:''" style="grid-area: 1/1/2/5;"/>
      <template v-if="service.available_for_activation">
        <button-main style="grid-area: 2/1/3/3;" label="Активировать(old)" @click="activate" button-style="outlined" size="full"/>
        <button-main style="grid-area: 2/3/3/5;" label="Активировать" @click="openModal('service_activation_modal')" :loading="loading.get_params" button-style="outlined" size="full"/>
      </template>
      <template>
        <button-main style="grid-area: 3/1/4/3;" label="Заменить AO" @click="openModal('equipment_replace_modal')" :loading="loading.get_params" button-style="outlined" size="full"/>
        <button-main style="grid-area: 3/3/4/5;" label="Привязать AO" @click="openModal('equipment_add_modal')" :loading="loading.get_params" button-style="outlined" size="full"/>
      </template>
      <account-iptv-code v-if="serviceType==='IPTV'" :account="accountNumber" :service="service" style="grid-area: 4/1/5/5;"/>
      
      <EquipmentCredentials v-for="(credentials,hardnumber,i) in credentialsByEquipments" :credentials="credentials" :hardnumber="hardnumber" :key="i" :style="{'grid-area': (5+i)+'/1/'+(6+i)+'/5'}"/>
    </div>
    <info-text-sec v-if="service.descr" :text="service.descr" rowClass="font--12-400" rowStyle="color:#918f8f;"/>
    <!--если есть оборудование которое смапилось с услугой в lbsv-account-content-->
    <title-main v-if="service.equipments&&service.equipments.length" @open="open_eq=!open_eq" text="Оборудование" :text2="service.equipments.length" textClass="font--13-500"/>
    <template v-if="open_eq">
      <template v-for="(equipment,i) of service.equipments">
        <devider-line style="margin:0px 16px;"/>
        <equipment :key="i" :equipment="equipment" :account="accountNumber" :mr_id="mr_id" :services="[service]"/>
      </template>
    </template>
    
    <modal-container ref="modal">
      <activation-modal :service="service" :account="accountNumber"/>
    </modal-container>
    <modal-container-custom v-if="serviceParams" ref="service_activation_modal" :footer="false" :wrapperStyle="{'min-height':'auto'}">
      <service-activation-modal @close="closeModal('service_activation_modal')" :service="service" :account="accountNumber" :serviceType="serviceType" :serviceName="typeService"/>
    </modal-container-custom>
    <modal-container-custom v-if="serviceParams" ref="equipment_replace_modal" :footer="false">
      <equipment-replace-modal @close="closeModal('equipment_replace_modal')" :service="service" :account="accountNumber" :serviceType="serviceType" :serviceParams="serviceParams"/>
    </modal-container-custom>
    <modal-container-custom v-if="serviceParams" ref="equipment_add_modal" :footer="false">
      <equipment-add-modal @close="closeModal('equipment_add_modal')" :service="service" :account="accountNumber" :serviceType="serviceType" :serviceParams="serviceParams"/>
    </modal-container-custom>
  </section>`,
  props: {
    account: { type: Object, required: true },
    accountNumber: { type: String, required: true },
    service: { type: Object, required: true },
    mr_id: { type: Number },
    isB2b: Boolean,
    isTooManyInternetServices: Boolean,
  },
  data: () => ({
    auth_type: "",
    user_rate: null,
    rate: "",
    loading: {
      get_auth_type: false,
      get_user_rate: false,
      get_params: false,
    },
    serviceParams: null,
    open_eq: true,
  }),
  computed: {
    isInernet() {
      return this.service.type == "internet" && this.service.isSession;
    },
    typeService() {
      return {
        "internet":"Интернет",
        "tv":"Телевидение",
        "analogtv":"Аналоговое ТВ",
        "digittv":"Цифровое ТВ",
        "phone":"Телефония",
        "hybrid":"ИТВ",
        "iptv":"IPTV",
        "other":"Другое",
      }[this.service.type]||this.service.serviceclassname;
    },
    serviceType() {
      switch (this.service.type) {
        case "phone":
          return "VOIP";
        case "digittv":
          return "CTV";
        case "internet":
        case "ott":
          return "SPD";
        case "iptv":
          return "IPTV";
        case "hybrid":
          return "ITV";
        case "analogtv":
        case "other":
        default:
          return;
      }
    },
    icon() {
      switch (this.service.type) {
        case "internet":
          return "eth";
        case "tv":
        case "analogtv":
        case "digittv":
        case "hybrid":
          return "tv";
        case "phone":
          return "phone-1";
        case "other":
        default:
          return "amount";
      }
    },
    serviceHasPassword() {
      const {type,billing_type,agenttype}=this.service;
      const isWrongPasswordService=billing_type==5&&agenttype==1;//40206469306
      return ["internet","phone"].includes(type) && !isWrongPasswordService;
    },
    stateClass() {
      return this.service.status == "0" ||
        (this.service.billing_type == 4 && this.service.status == "12")
        ? "main-green"
        : "main-red";
    },
    authAndSpeed() {
      const fields = [this.auth_type, this.rate];
      if (fields.length == 1) {
        return fields[0];
      }
      return fields.filter((field) => field).join(" • ");
    },
    credentialsByEquipments(){
      const {equipments}=this.service;
      return equipments.reduce((credentialsBySerial,equipment)=>{
        const {credentials,service_equipment:{hardnumber=''}}=equipment;
        if(credentials&&hardnumber){
          credentialsBySerial[hardnumber]=credentials
        };
        return credentialsBySerial
      },{});
    },
  },
  created() {
    if (this.isInernet && !this.isB2b && !this.isTooManyInternetServices) {
      this.getAuthAndSpeed();
      this.getParams();
    }
  },
  methods: {
    testAndOpenModalOrLoadInfo() {
      if (this.loading.get_user_rate) {
        return;
      }
      if (!this.user_rate && this.isInernet) {
        this.getAuthAndSpeed();
      } else {
        this.openModal("billing_info_modal");
      }
    },
    getAuthAndSpeed() {
      let params = {
        login: this.service.login,
        vgid: this.service.vgid,
        serverid: this.service.serverid,
      };

      this.loading.get_auth_type = true;
      httpGet(buildUrl("get_auth_type", params, "/call/aaa/"), true)
        .then((response) => {
          this.loading.get_auth_type = false;
          if (
            response.code == "200" &&
            response.data &&
            response.data.length &&
            response.data[0].auth_type
          ) {
            this.auth_type = response.data[0].auth_type;
          }
        })
        .catch((error) => {
          console.warn("get_auth_type:error", error);
          this.loading.get_auth_type = false;
        });

      this.loading.get_user_rate = true;
      httpGet(buildUrl("get_user_rate", params, "/call/aaa/"), true)
        .then((response) => {
          this.loading.get_user_rate = false;
          if (
            response.code == "200" &&
            response.data &&
            response.data.length &&
            (response.data[0].rate || response.data[0].rate == 0)
          ) {
            this.rate = response.data[0].rate + " Мбит/c";
            this.user_rate = response.data;
          } else {
            this.user_rate = [response]; //временный костыль чтобы показать ошибку
          }
        })
        .catch((error) => {
          console.warn("get_user_rate:error", error);
          this.loading.get_user_rate = false;
        });
    },
    async getParams() {
      if (!this.accountNumber || !this.serviceType) return;
      this.loading.get_params = true;
      try {
        const response=await httpGet(buildUrl("get_params",{account:this.accountNumber,service_type:this.serviceType},"/call/sms_gateway/"));
        if(!response.isError&&response.result_code === "OK"&&Array.isArray(response.parameters)){
          this.serviceParams = response.parameters;
        }
      }catch(error){
        console.warn('get_params',error)
      }
      this.loading.get_params = false;
      return this.serviceParams;
    },
    activate() {
      this.$refs.modal.open();
    },
    async openModal(ref=""){
      if(!this.serviceParams){
        await this.getParams();
      };
      if(!this.serviceParams){return};
      if(ref&&this.$refs[ref]){
        this.$refs[ref].open();
      }
    },
    closeModal(ref = "") {
      if (ref && this.$refs[ref]) {
        this.$refs[ref].close();
      }
    },
  },
});
