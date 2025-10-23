import Vue from 'vue'
import Vuex from 'vuex'
import dashboardModule from './modules/dashboard.module.js';

Vue.use(Vuex)

const store = new Vuex.Store({
    modules: {
        dashboardModule
    },
    debug: true,
    state: {
        username: null,
        password: null,
        server: null,
   webhookUrl: (() => {
        const url = process.env.VUE_APP_WEBHOOK_URL;
        if (!url) return null;
        const cleanedUrl = url.replace(/\/$/, ''); // remove trailing slash
        return cleanedUrl.endsWith('/webhook') ? cleanedUrl : cleanedUrl + '/webhook';
    })()
    },
    actions: {
        loginAction(context, payload) {
            if (this.debug) console.log(`Logging with ${payload.user} and ${payload.pass}`);
            context.commit('login', payload);
        },
        logoutAction(context) {
            if (this.debug) console.log(`Logout`);
            context.commit('logout');
        },
        setWebhookUrlAction(context, payload) {
            if (this.debug) console.log(`Setting webhook URL: ${payload}`);
            context.commit('setWebhookUrl', payload);
        }
    },
    mutations: {
        login(state, payload) {
            state.username = payload.user;
            state.password = payload.pass;
            state.server = payload.server;
            return state;
        },
        logout(state) {
            state.username = null;
            state.password = null;
            state.server = null;
            state.webhookUrl = null; // clear webhook on logout
            return state;
        },
        setWebhookUrl(state, payload) {
            console.log("Mutation @ setWebhookUrl called with payload:", payload);
            state.webhookUrl = payload;
            return state;
        }
    }
});

export default store;
