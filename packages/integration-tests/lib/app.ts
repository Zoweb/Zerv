import Zerv from "@zerv/framework";
//Zerv.disableDebugLogging();

const app = new Zerv("#app");

app.data.title = "Test App";
app.data.styleAttribute = "background: blue";

app.data.user = {
    name: "test"
};
app.data.user.email = {
    name: "testing",
    host: "example.com"
};
app.data.user.email.other = {
    port: 80
};

app.render();

setTimeout(() => app.data.styleAttribute = "font-weight:400", 1000);