import Zerv from "@zerv/framework";
Zerv.disableDebugLogging();

const app = new Zerv("#app");

app.data.title = "Test App";
app.data.test = 4;

setTimeout(() => app.data.test = 100, 1000);

app.render();