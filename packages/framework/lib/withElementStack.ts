export function getPathTo(element: HTMLElement) {
    if (element.id !== "") return `#${element.id}`;
    if (element === document.body) return "body";

    let idx = 0;
    const siblings = Array.from(element.parentNode.childNodes);
    for (const sibling of siblings) {
        if (sibling === element) return `${getPathTo(element.parentElement)} -> ${element.tagName}(${idx + 1})`;
        if (sibling instanceof HTMLElement && sibling.tagName === element.tagName) idx++;
    }
}

export default function withElementStack(error: Error, element: Node) {
    const uniquePath = getPathTo(element instanceof HTMLElement ? element : element.parentElement);
    error.message += `\nCaused by: ${uniquePath}`;
    return error;
}