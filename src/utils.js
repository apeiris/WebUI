import axios from 'axios';
import store from './store';

const Utils = {
  URLEncode: function (element, key, list) {
    list = list || [];
    if (typeof element == 'object') {
      for (var idx in element)
        Utils.URLEncode(element[idx], key ? key + '[' + idx + ']' : idx, list);
    } else {
      list.push(key + '=' + encodeURIComponent(element));
    }
    return list.join('&');
  },

  Crud: {
    async getList(resource) {
      const url = store.state.server + `/${resource}/list`;
      console.log('Getting List from', url);
      try {
        const response = await axios.get(url, {
          auth: { username: store.state.username, password: store.state.password }
        });
        if (response.data.type === 'OK') {
          return response.data.results;
        } else {
          throw response.data.result;
        }
      } catch (e) {
        console.log(e);
        throw (`Error getting ${resource} list:\n${e}`);
      }
    },

    async getListChart(resource, range) {
      const url = store.state.server + `/${resource}/data_charts?startDate=${range.startDate}&endDate=${range.endDate}`;
      try {
        const response = await axios.get(url, {
          auth: { username: store.state.username, password: store.state.password }
        });
        if (response.data.type === 'OK') {
          return response.data.results;
        } else {
          throw response.data.result;
        }
      } catch (e) {
        console.log(e);
        throw (`Error getting ${resource} list:\n${e}`);
      }
    },

    async getObject(resource, index, empty) {
      console.log(`Loading Object ${index} from ${resource}`);
      const emptyObject = Object.assign({}, empty, { "_id": null });
      if (index === 'new') return emptyObject;

      const list = await this.getList(resource);
      const item = list[index];
      const url = store.state.server + `/${resource}/view/${item}`;
      try {
        const response = await axios.get(url, {
          auth: { username: store.state.username, password: store.state.password }
        });
        if (response.data.type === 'OK') {
          const results = response.data.results[0];
          results._id = index;
          return results;
        } else {
          throw response.data.result;
        }
      } catch (e) {
        console.log(e);
        throw (`Error loading Object ${index}:\n${e}`);
      }
    },

    async getObjectFilter(resource, index, empty) {
      const url = store.state.server + `/${resource}/filter/${empty.name}`;
      try {
        const response = await axios.get(url, {
          auth: { username: store.state.username, password: store.state.password }
        });
        if (response.data.type === 'OK') {
          const results = response.data.results[0];
          results._id = index;
          return results;
        } else {
          throw response.data.result;
        }
      } catch (e) {
        console.log(e);
        throw (`Error loading Object ${index}:\n${e}`);
      }
    },

    async saveObject(resource, data) {
      console.log('Saving', data);
      const old_id = data._id;
      let result;
      if (old_id !== null) {
        await this.deleteObject(resource, old_id);
        result = await this.createObject(resource, data);
      } else {
        result = await this.createObject(resource, data);
      }
      await this.sendWebhook("save", resource, data);
      return result;
    },

    async importCertificate(data) {
      console.log('Importing certificate', data);
      const url = store.state.server + `/cert/importbystream/${data.alias}`;
      try {
        let form = '';
        if (data._prefix) {
          form = data._prefix + '&';
        }
        delete data._prefix;
        form += Utils.URLEncode(data);

        console.log('Posting Data', form);
        const response = await axios.post(url, form, {
          auth: { username: store.state.username, password: store.state.password }
        });
        if (response.data.type === 'OK') {
          await this.sendWebhook("importCertificate", "cert", data);
          return true;
        } else {
          throw response.data.result;
        }
      } catch (e) {
        console.log(e, url);
        throw (`Error Creating Object:\n${e}`);
      }
    },

    async createObject(resource, data) {
      const url = store.state.server + `/${resource}/add/${data.name}`;
      console.log('Creating', data);
      try {
        let form = '';
        if (data._prefix) {
          form = data._prefix + '&';
        }
        delete data._prefix;
        form += Utils.URLEncode(data);

        console.log('Posting Form', form);
        const response = await axios.post(url, form, {
          auth: { username: store.state.username, password: store.state.password }
        });
        if (response.data.type === 'OK') {
          await this.sendWebhook("create", resource, data);
          return true;
        } else {
          throw response.data.result;
        }
      } catch (e) {
        console.log(e, url);
        throw (`Error Creating Object:\n${e}`);
      }
    },

    async deleteObject(resource, index) {
      console.log('Deleting', index);
      const list = await this.getList(resource);
      const item = list[index];
      const url = store.state.server + `/${resource}/delete/${item}`;
      try {
        const response = await axios.get(url, {
          auth: { username: store.state.username, password: store.state.password }
        });
        if (response.data.type === 'OK') {
            console.log('sending delete via webhook', resource, { id: item });
          await this.sendWebhook("delete", resource, { id: item });
          return true;
        } else {
          throw response.data.result;
        }
      } catch (e) {
        console.log(e, url);
        throw (`Error deleting Object ${index}:\n${e}`);
      }
    },

    async sendWebhook(eventType, resource, data) {
      try {
        const webhookUrl = store.state.webhookUrl;
        if (!webhookUrl) {
          console.warn("Webhook URL not configured in store.state.webhookUrl");
          return;
        }

        const payload = {
          event: eventType,
          resource,
          data,
          timestamp: new Date().toISOString()
        };

        console.log("Sending webhook:", payload);

        await axios.post(webhookUrl, payload, {
          headers: { "Content-Type": "application/json" }
        });

        console.log("Webhook sent successfully");
      } catch (err) {
        console.error("Webhook failed:", err.message || err);
      }
    }
  }
};

export default Utils;
