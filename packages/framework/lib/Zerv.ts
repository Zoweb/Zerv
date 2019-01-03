import ZervProxyHandler from "./ZervProxyHandler";

export interface ZervOptions {
    data?: object;
    options: ZervAppOptions;
}

export interface ZervAppOptions {
    /**
     * The start and end values used to find template values
     */
    edges: {
        start: string;
        end: string;
    };
}

export default class Zerv {
    static disableDebugLogging() {
        console.debug = () => {};
    }

    private proxyHandler: ZervProxyHandler = new ZervProxyHandler(this);
    private isRendered: boolean = false;

    _realData: any;

    data: any;
    options: ZervAppOptions;

    app: HTMLElement;

    constructor(app: string, {
                    data,
                    options
    }: ZervOptions = {
        data: {},
        options: {
            edges: {
                start: "{{",
                end: "}}"
            }
        }
    }) {
        this._realData = data;
        this.data = new Proxy(this._realData, this.proxyHandler);
        this.app = document.querySelector(app);
        this.options = options;

        this.proxyHandler.source = this.app;
    }

    render() {
        if (this.isRendered) throw new Error("App is already rendered.");
        this.isRendered = true;

        this.proxyHandler.run();
    }
}