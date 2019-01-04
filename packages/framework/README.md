# `@zerv/framework`

> Zerv frontend framework system

## Example

```html
<!-- index.html -->
...
<div id="app">
<h1>{{title}}</h1>
<p>Welcome, <strong>{{user.name}}</strong>. This is your visit number {{user.visitCount + 1}}!</p>
<p>Your email is {{user.email.name}}@{{user.email.host}}</p>
<p>Want a different username? Type it in here: <input type="text" z-bind="user.name" /></p>
</div>
...
<script src="app.ts"></script>
```
```typescript
import Zerv from "@zerv/framework";
Zerv.disableDebugLogging(); // Currently required to remove debug logs.

// Create a new Zerv app. View options below.
const app = new Zerv("#app");

// Set data before rendering to prevent flickers and warnings.
app.data.user = {
    title: "Test App",
    name: "FooMan",
    visitCount: 52,
    email: {
        name: "fooman",
        host: "example.com"
    }
};

app.render();

```
