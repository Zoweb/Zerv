![Logo](icon.png)

![License](https://img.shields.io/github/license/zoweb/Zerv.svg)
![Version](https://img.shields.io/npm/v/@zerv/framework.svg)
![Last Commit](https://img.shields.io/github/last-commit/zoweb/zerv.svg)
![David Dependency Status](https://david-dm.org/zoweb/zerv.svg)

## Features

 - Simple but powerful templating, supporting any host language
 - Automatic updates for template contents when the data changes
 - Tiny size - fast to load

## Getting Started
1. Install with yarn:
	`yarn add @zerv/framework`
	or with npm:
	`npm install @zerv/framework`
2. Import into your library and create an app
	```javascript
	import Zerv from "@zerv/framework";
	
	const app = new Zerv("#app");
	app.data.name = "My First App";
	app.render();
	```
3. Bundle into a module with your TypeScript compatible bundler of choice
4. Open in your browser and watch the magic!

## How it works
### Template Engine
When `app.render()` is run, the template engine looks through your DOM tree for any `z-bind:` attributes or areas surrounded by `{{` and `}}` (or whatever you choose to use). It will also listen for changes to the DOM to do the same to any newly created elements.
The engine will then parse any template values and attempt to find all the variables it is referencing, which it will then listen too under the `app.data` object. When any referenced data changes, it will reevaluate the value, cache it, and assign it to where it should go.

### Data storage and listening
All data stored under the `app.data` object is being observed, and logging it will show that all objects under `app.data` (including itself) are actually `Observer`s. When any data is changed, it will get passed down into the `app.data` observer, which is an instance of the `ZervProxyHandler` class. This class will then propagate the changes, as well as firing any listeners created by the template engine.

## Community
All feedback, suggestions, bug reports, and fixes are welcome! Please do all of these on the issues page.

## License
MIT
