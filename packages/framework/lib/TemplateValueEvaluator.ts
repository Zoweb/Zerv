import {
    ArrayExpression,
    BinaryExpression,
    CallExpression, Compound, ConditionalExpression,
    Expression,
    Identifier,
    Literal,
    MemberExpression
} from "jsep";
import * as jsep from "jsep";

export default class TemplateValueEvaluator {
    static parse(input: string) {
        return jsep(input);
    }

    readonly ast: jsep.Expression;

    identifiers: string[];
    source: string;

    scope: any = {};
    methods: {[name: string]: Function};

    constructor(source: string) {
        this.source = source;
        this.ast = TemplateValueEvaluator.parse(source);

        this.identifiers = this.findIdentifiers(this.ast).identifierList;
    }

    findIdentifiers(part: Expression = this.ast) {
        console.debug("Finding expresion in", part.type);

        const identifierList: string[] = [];
        const valueList: (string | number | boolean)[] = [];

        if (part.type === "ArrayExpression") {
            const partArrayExpression = part as ArrayExpression;
            for (const expression of partArrayExpression.elements) {
                identifierList.push(...this.findIdentifiers(expression).identifierList);
            }

            valueList.push(...identifierList);
        }

        if (part.type === "BinaryExpression") {
            const partBinaryExpression = part as BinaryExpression;
            identifierList.push(...this.findIdentifiers(partBinaryExpression.left).identifierList);
            identifierList.push(...this.findIdentifiers(partBinaryExpression.right).identifierList);
            valueList.push(...identifierList);
        }

        if (part.type === "CallExpression") {
            const partCallExpression = part as CallExpression;
            for (const argument of partCallExpression.arguments) {
                identifierList.push(...this.findIdentifiers(argument).identifierList);
            }

            valueList.push(...identifierList);
        }

        if (part.type === "Compound") {
            const partCompound = part as Compound;
            for (const expression of partCompound.body) {
                identifierList.push(...this.findIdentifiers(expression).identifierList);
            }

            valueList.push(...identifierList);
        }

        if (part.type === "ConditionalExpression") {
            const partConditionalExpression = part as ConditionalExpression;
            identifierList.push(...this.findIdentifiers(partConditionalExpression.test).identifierList);
            identifierList.push(...this.findIdentifiers(partConditionalExpression.consequent).identifierList);
            identifierList.push(...this.findIdentifiers(partConditionalExpression.alternate).identifierList);

            valueList.push(...identifierList);
        }

        if (part.type === "Literal") {
            const partLiteral = part as Literal;
            valueList.push(partLiteral.value.toString());
        }

        if (part.type === "Identifier") {
            const partIdentifier = part as Identifier;
            identifierList.push(partIdentifier.name);
            valueList.push(...identifierList);
        }

        if (part.type === "MemberExpression") {
            const partMemberExpression = part as MemberExpression;
            const identifier = [];
            identifier.push(...this.findIdentifiers(partMemberExpression.object).valueList);
            identifier.push(...this.findIdentifiers(partMemberExpression.property).valueList);
            identifierList.push(identifier.join("."));
            valueList.push(...identifierList);
        }

        return {
            identifierList,
            valueList
        };
    }

    findIdentifier(part: Expression) {
        return this.findIdentifiers(part).identifierList[0];
    }

    /**
     * Updates the scope variable. Will not reevaluate source.
     * @param path
     * @param value
     */
    update(path: string, value: any) {
        const split = path.split(".");
        const el = split
            .slice(0, split.length - 1)
            .reduce((prev, curr) => {
                if (!prev[curr]) prev[curr] = {};
                return prev[curr];
            }, this.scope);

        const last = split.slice(-1)[0];
        el[last] = value;
    }

    read(path: string) {
        return path.split(".")
            .reduce((prev, curr) => (prev || {})[curr], this.scope);
    }

    /**
     * Evaluates the source using the scope, and returns the result
     */
    evaluate(part: Expression = this.ast): any {
        let result: any;

        if (part.type === "Literal") {
            const partLiteral = part as Literal;
            result = partLiteral.value;
        }

        if (part.type === "BinaryExpression") {
            const partBinary = part as BinaryExpression;

            const left = this.evaluate(partBinary.left);
            const right = this.evaluate(partBinary.right);

            switch (partBinary.operator) {
                case "+": result = left + right; break;
                case "-": result = left - right; break;
                case "*": result = left * right; break;
                case "/": result = left / right; break;
            }
        }

        if (part.type === "MemberExpression" || part.type === "Identifier") {
            const path = this.findIdentifier(part);
            result = this.read(path);
        }

        return result;
    }
}