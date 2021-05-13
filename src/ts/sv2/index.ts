import {getMarkdown} from "../markdown/getMarkdown";
import {uploadFiles} from "../upload/index";
import {isCtrl} from "../util/compatibility";
import {focusEvent, hotkeyEvent, scrollCenter, selectEvent} from "../util/editorCommonEvent";
import {getSelectText2} from "./getSelectText";
import {html2md} from "./html2md";
import {inputEvent} from "./inputEvent";
import {insertText2} from "./insertText";

class Editor2 {
    public element: HTMLPreElement;
    public composingLock: boolean;
    public preventInput: boolean;
    public processTimeoutId: number;
    public hlToolbarTimeoutId: number;
    public range: Range;

    constructor(vditor: IVditor) {
        this.element = document.createElement("pre");
        this.element.className = "vditor-sv2";
        this.element.setAttribute("placeholder", vditor.options.placeholder);
        this.element.setAttribute("contenteditable", "true");
        this.element.setAttribute("spellcheck", "false");

        this.bindEvent(vditor);

        focusEvent(vditor, this.element);
        hotkeyEvent(vditor, this.element);
        selectEvent(vditor, this.element);
    }

    private bindEvent(vditor: IVditor) {
        this.element.addEventListener("copy", (event: ClipboardEvent) => {
            event.stopPropagation();
            event.preventDefault();
            event.clipboardData.setData("text/plain", getSelectText2(this.element));
        });

        this.element.addEventListener("keypress", (event: KeyboardEvent) => {
            if (!isCtrl(event) && event.key === "Enter") {
                insertText2(vditor, "\n", "", true);
                scrollCenter(vditor);
                event.preventDefault();
            }
        });

        this.element.addEventListener("input", () => {
            inputEvent(vditor, {
                enableAddUndoStack: true,
                enableHint: true,
                enableInput: true,
            });
            // 选中多行后输入任意字符，br 后无 \n
            this.element.querySelectorAll("br").forEach((br) => {
                if (!br.nextElementSibling) {
                    br.insertAdjacentHTML("afterend", '<span style="display: none">\n</span>');
                }
            });
        });

        this.element.addEventListener("blur", () => {
            if (vditor.options.blur) {
                vditor.options.blur(getMarkdown(vditor));
            }
        });

        this.element.addEventListener("scroll", () => {
            if (vditor.preview.element.style.display !== "block") {
                return;
            }
            const textScrollTop = this.element.scrollTop;
            const textHeight = this.element.clientHeight;
            const textScrollHeight = this.element.scrollHeight - parseFloat(this.element.style.paddingBottom || "0");
            const preview = vditor.preview.element;
            if ((textScrollTop / textHeight > 0.5)) {
                preview.scrollTop = (textScrollTop + textHeight) *
                    preview.scrollHeight / textScrollHeight - textHeight;
            } else {
                preview.scrollTop = textScrollTop *
                    preview.scrollHeight / textScrollHeight;
            }
        });

        if (vditor.options.upload.url || vditor.options.upload.handler) {
            this.element.addEventListener("drop", (event: CustomEvent & { dataTransfer?: DataTransfer }) => {
                if (event.dataTransfer.types[0] !== "Files") {
                    insertText2(vditor, getSelection().toString(), "", false);
                    event.preventDefault();
                    return;
                }
                const files = event.dataTransfer.items;
                if (files.length === 0) {
                    return;
                }
                uploadFiles(vditor, files);
                event.preventDefault();
            });
        }

        this.element.addEventListener("paste", (event: ClipboardEvent) => {
            const textHTML = event.clipboardData.getData("text/html");
            const textPlain = event.clipboardData.getData("text/plain");
            event.stopPropagation();
            event.preventDefault();
            if (textHTML.trim() !== "") {
                if (textHTML.replace(/<(|\/)(html|body|meta)[^>]*?>/ig, "").trim() ===
                    `<a href="${textPlain}">${textPlain}</a>` ||
                    textHTML.replace(/<(|\/)(html|body|meta)[^>]*?>/ig, "").trim() ===
                    `<!--StartFragment--><a href="${textPlain}">${textPlain}</a><!--EndFragment-->`) {
                    // https://github.com/b3log/vditor/issues/37
                } else {
                    const tempElement = document.createElement("div");
                    tempElement.innerHTML = textHTML;
                    tempElement.querySelectorAll("[style]").forEach((e) => {
                        e.removeAttribute("style");
                    });
                    tempElement.querySelectorAll(".vditor-copy").forEach((e) => {
                        e.remove();
                    });
                    tempElement.querySelectorAll(".vditor-anchor").forEach((e) => {
                        e.remove();
                    });
                    const mdValue = html2md(vditor, tempElement.innerHTML, textPlain).trimRight();
                    insertText2(vditor, mdValue, "", true);
                    return;
                }
            } else if (textPlain.trim() !== "" && event.clipboardData.files.length === 0) {
                // https://github.com/b3log/vditor/issues/67
            } else if (event.clipboardData.files.length > 0) {
                // upload file
                if (!(vditor.options.upload.url || vditor.options.upload.handler)) {
                    return;
                }
                // NOTE: not work in Safari.
                // maybe the browser considered local filesystem as the same domain as the pasted data
                uploadFiles(vditor, event.clipboardData.files);
                return;
            }
            insertText2(vditor, textPlain, "", true);
        });
    }
}

export {Editor2};
