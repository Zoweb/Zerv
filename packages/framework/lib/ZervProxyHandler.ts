import IPathObserverList from "./IPathObserverList";
import search from "@zerv/search/lib/search";
import {SearchResultType} from "@zerv/search/lib/ISearchResult";
import Zerv from "./Zerv";
import IElementData from "./IElementData";
import TemplateValueEvaluator from "./TemplateValueEvaluator";
import withElementStack from "./withElementStack";

export class ZervNestedProxyHandler implements ProxyHandler<object> {
    static isProxy = Symbol("Object Is Proxy");
    static createProxyAutomatically = false;

    parent: ZervNestedProxyHandler;
    name: string;

    constructor(parent = null, name = "") {
        this.parent = parent;
        this.name = name;
    }

    get path() {
        if (this.parent === null) return this.name;
        else return `${this.parent.path}.${this.name}`;
    }

    get(target: object, prop: PropertyKey, receiver: any): any {
        if (prop === ZervNestedProxyHandler.isProxy) {
            console.debug("Got request to say that this is a proxy:", this.path);
            return true;
        }

        if (typeof target[prop] === "object" && target[prop] !== null && !target[prop][ZervNestedProxyHandler.isProxy]) {
            return new Proxy(target[prop], new ZervNestedProxyHandler(this, prop.toString()));
        }

        return target[prop];
    }

    set(target: object, prop: PropertyKey, value: any, receiver: any, handler: ZervNestedProxyHandler = this, createProxy: boolean = ZervNestedProxyHandler.createProxyAutomatically, iteration: number = 0): boolean {
        if (iteration > 50) throw new Error("Overflow: something broke");

        /*if (target[ZervNestedProxyHandler.skipPassdownSymbol] === true || prop === ZervNestedProxyHandler.skipPassdownSymbol || !createProxy) {
            console.debug("Skipping pass down for", this.path, target, prop, value);
            return true;
        } else {

        }*/

        // loop through the elements inside this object, and make them be proxies if they are not
        if (value[ZervNestedProxyHandler.isProxy] !== true && typeof value === "object" && value !== null) {
            for (const key of Object.keys(value)) {
                let val = value[key];
                if (typeof val !== "object" || val === null) {
                    console.debug("Value is not an object");
                    continue;
                }

                if (val[ZervNestedProxyHandler.isProxy] === true) {
                    console.debug("Value was already a proxy. Skipping.");
                    continue;
                }

                val = new Proxy(val, new ZervNestedProxyHandler(this, `${prop.toString()}.${key}`));
            }
        }

        console.debug("Detected change, passing down to parents (i am", this.path, "):", target, prop, value, receiver, handler, createProxy, iteration, this.path);
        return this.parent.set(target, prop, value, receiver, handler, createProxy, iteration + 1);
    }
}

export default class ZervProxyHandler extends ZervNestedProxyHandler {
    private static getRealNode(node: Node) {
        let current: Node = node;
        while (current.nodeType === 3 /* text */) {
            current = current.parentNode;
        }
        return current;
    }

    private static getDataValue(data: any, path: string) {
        return path.split(".").reduce((prev, curr) => (prev || {})[curr], data);
    }

    private static setDataValue(data: any, path: string, value: any) {
        const split = path.split(".");
        const el = path.split(".")
            .slice(0, split.length - 1)
            .reduce((prev, curr) => {
                if (!prev[curr]) prev[curr] = {};
                return prev[curr];
            }, data);

        const last = split.slice(-1)[0];
        el[last] = value;
    }

    private static updateNodeValue(
        node: Node, type: "text" | "attribute",
        newValue: any,
        codeName: string,
        dataModifier: (newValue: string) => string = d => d,
        attributeName?: string
    ) {
        if (type === "attribute" && typeof attributeName === "undefined")
            throw withElementStack(new TypeError("Attribute name must be specified when adding an attribute changer."), node);

        console.debug("Updating node name for", node, ":", newValue);

        if (typeof newValue === "undefined") {
            newValue = `{{${codeName}}}`;

            console.warn("Templated element", ZervProxyHandler.getRealNode(node),
                `contains reference to \`${codeName}\`, which does not yet exist.`,
                "(source node:", node, ")");
        }

        if (typeof newValue === "object") {
            newValue = JSON.stringify(newValue);
        }

        newValue = dataModifier(newValue);

        console.debug("Updating node value to", newValue);
        if (type === "text") node.textContent = newValue;
        if (type === "attribute" && node instanceof HTMLElement) {
            if (attributeName === "value" && node instanceof HTMLInputElement) node.value = newValue;
            node.setAttribute(attributeName, newValue);
        }
    }

    private symbols = {
        nodeHasBeenProcessed: Symbol("Zerv Internal: Node has been processed"),
        nodeData: Symbol("Zerv Internal: Node Data"),
        nodeId: Symbol("Zerv Internal: Node ID")
    };

    source: HTMLElement;
    observer: MutationObserver = new MutationObserver(this.onMutation.bind(this));

    observedPaths: IPathObserverList = {};
    nextNodeId: number = 0;

    app: Zerv;

    private getNodeDataSection(node: Node, type: "text" | "attribute", attributeName?: string) {
        if (type === "attribute" && typeof attributeName === "undefined")
            throw new TypeError("Attribute name must be specified when adding an attribute changer.");

        // create the objects in the node
        if (typeof node[this.symbols.nodeData] === "undefined") node[this.symbols.nodeData] = {};
        const nodeStoredData = node[this.symbols.nodeData];
        if (type === "attribute" && typeof nodeStoredData.attributes === "undefined") nodeStoredData.attributes = {};

        // get a single section to use for everything
        const dataSection: IElementData = {};
        if (type === "text") nodeStoredData.text = dataSection;
        else if (type === "attribute") nodeStoredData.attributes[attributeName] = dataSection;

        return dataSection;
    }

    private addNodeChanger(node: Node, type: "text" | "attribute", attributeName?: string) {
        if (type === "attribute" && typeof attributeName === "undefined")
            throw new TypeError("Attribute name must be specified when adding an attribute changer.");

        const dataSection = this.getNodeDataSection(node, type, attributeName);

        // get the text from the node
        const sourceText = type === "text" ? node.textContent : node instanceof HTMLElement ? node.getAttribute(attributeName) : null;
        const workableSourceText = type === "attribute" ? `{{${sourceText}}}` : sourceText;
        dataSection.originalValue = sourceText;

        // parse the text to find template values
        const nodeData = search(workableSourceText, this.app.options.edges);
        const nodeValues = nodeData.map(it => it.content);

        dataSection.nodeData = nodeData;
        dataSection.nodeValues = nodeValues;

        // find the observed paths from the data
        for (let i = 0; i < nodeData.length; i++) {
            const dataSection = nodeData[i];
            if (dataSection.type !== SearchResultType.code) continue;

            const sectionContent = dataSection.content;

            const evaluator = new TemplateValueEvaluator(sectionContent);

            for (const observedPath of evaluator.identifiers) {
                if (typeof this.observedPaths[observedPath] === "undefined") this.observedPaths[observedPath] = [];

                this.observedPaths[observedPath].push({
                    nodeId: node[this.symbols.nodeId],
                    onChange(newValue: any) {
                        evaluator.update(observedPath, newValue);
                        const value = evaluator.evaluate();

                        ZervProxyHandler.updateNodeValue(node, type, value, observedPath, value => {
                            nodeValues[i] = value;
                            return nodeValues.join("");
                        }, attributeName);
                    }
                });

                const firstValue = ZervProxyHandler.getDataValue(this.app._realData, observedPath);
                evaluator.update(observedPath, firstValue);
                const firstValueEvaluated = evaluator.evaluate();

                ZervProxyHandler.updateNodeValue(node, type, firstValueEvaluated, observedPath, value => {
                    nodeValues[i] = value;
                    return nodeValues.join("");
                }, attributeName);
            }
        }
    }

    private handleNodeAddition(node: Node) {
        if (node[this.symbols.nodeHasBeenProcessed]) return;
        node[this.symbols.nodeHasBeenProcessed] = true;

        const nodeId = node[this.symbols.nodeId] = this.nextNodeId++;

        console.debug("Processing added node:", node, nodeId);

        if (node instanceof HTMLElement) {
            console.debug("Node is an element so we'll do its attributes.");

            console.debug("Checking for z-bind attributes on node");
            for (const attributeName of node.getAttributeNames()) {
                if (!attributeName.startsWith("z-bind:")) continue;

                const fixedAttributeName = attributeName.substr("z-bind:".length);
                node.setAttribute(fixedAttributeName, node.getAttribute(attributeName));
                node.removeAttribute(attributeName);

                this.addNodeChanger(node, "attribute", fixedAttributeName);
            }

            if (node.hasAttribute("z-bind")) {
                // node value is bound to a variable
                const variableName = node.getAttribute("z-bind");
                node.removeAttribute("z-bind");

                const listener = () => {
                    setTimeout(() => {
                        const newValue = (<HTMLInputElement> node).value || node.textContent;
                        ZervProxyHandler.setDataValue(this.app.data, variableName, newValue);
                    }, 0);
                };

                node.addEventListener("change", listener);
                node.addEventListener("keydown", listener);
                node.addEventListener("input", listener);
            }
        } else {
            this.addNodeChanger(node, "text");
        }
    }

    private handleNodeRemoval(node: Node) {
        console.debug("Processing removed node:", node, node[this.symbols.nodeId]);

        if (!node[this.symbols.nodeHasBeenProcessed]) return;
        const nodeId = node[this.symbols.nodeId];

        for (const key of Object.keys(this.observedPaths)) {
            const pathObservers = this.observedPaths[key];

            for (const pathObserver of pathObservers) {
                if (pathObserver.nodeId === nodeId) {
                    pathObservers.splice(pathObservers.indexOf(pathObserver), 1);
                }
            }
        }
    }

    private addStartingNodes(node: Node) {
        console.debug(node, "child nodes:", node.childNodes);
        this.handleNodeAddition(node);
        node.childNodes.forEach(childNode => {
            if (childNode.nodeType === 3 /* text */) this.handleNodeAddition(childNode);
            else this.addStartingNodes(childNode);
        });
    }

    constructor(app: Zerv) {
        super();

        this.app = app;
    }

    get(target: object, prop: PropertyKey, receiver: any): any {
        if (prop === ZervNestedProxyHandler.isProxy) {
            console.debug("Got request to say that this is a proxy: root");
            return true;
        }

        if (typeof target[prop] === "object" && target[prop] !== null) {
            return new Proxy(target[prop], new ZervNestedProxyHandler(this, prop.toString()));
        }

        return target[prop];
    }

    set(target: object, prop: PropertyKey, value: any, receiver: any, handler?: ZervNestedProxyHandler, createProxy: boolean = ZervNestedProxyHandler.createProxyAutomatically, iteration: number = 0): boolean {
        console.debug("Detected change:", target, prop, value, receiver, handler, createProxy, iteration);

        if (iteration > 50) throw new Error("Overflow: something broke");

        if (typeof handler !== "undefined") {
            prop = `${handler.path.substr(1)}.${prop.toString()}`;
            console.debug("Note: came from handler, updated prop to", prop);
        }

        console.debug("Setting data value");

        ZervProxyHandler.setDataValue(this.app._realData, prop.toString(), value);

        console.debug("Finding required updates");
        const updatesRequired = Object.keys(this.observedPaths)
            .filter(it =>
                it.startsWith(prop.toString()) ||
                prop.toString().startsWith(it)
            );

        console.debug("Updates required for", prop, ":", updatesRequired);

        for (const updateRequired of updatesRequired) {
            const updateList = this.observedPaths[updateRequired];

            const data = ZervProxyHandler.getDataValue(this.app._realData, updateRequired);

            for (const update of updateList) {

                update.onChange(data);
            }
        }

        target[prop] = value;

        return true;
    }

    run() {
        console.debug("-------------------------------------------");
        console.debug("Running Zerv");

        console.debug("Checking for availability of target element");
        if (this.source === null) throw new TypeError("Target element must exist");
        else console.debug("Target element exists:", this.source);

        console.debug("Beginning mutation observation");
        this.observer.observe(this.source, {
            attributes: true,
            childList: true,
            characterData: true,
            subtree: true
        });

        this.addStartingNodes(this.source);
    }

    onMutation(mutations: MutationRecord[]) {
        for (const mutation of mutations) {
            mutation.removedNodes.forEach(node => {
                this.handleNodeRemoval(node);
            });

            mutation.addedNodes.forEach(node => {
                this.handleNodeAddition(node);
            });
        }
    }
}