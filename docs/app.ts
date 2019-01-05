import Zerv from "../packages/framework";
Zerv.disableDebugLogging();

const app = new Zerv("#app");

app.data.app = {
    name: "Zerv Docs"
};

app.render();