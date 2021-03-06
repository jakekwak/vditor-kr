import "./assets/scss/index.scss";
import VditorMethod from "./method";
import {Constants, VDITOR_VERSION} from "./ts/constants";
import {DevTools} from "./ts/devtools/index";
import {Hint} from "./ts/hint/index";
import {i18n} from "./ts/i18n/index";
import {IR} from "./ts/ir/index";
import {input as irInput} from "./ts/ir/input";
import {processAfterRender} from "./ts/ir/process";
import {getHTML} from "./ts/markdown/getHTML";
import {getMarkdown} from "./ts/markdown/getMarkdown";
import {setLute} from "./ts/markdown/setLute";
import {Outline} from "./ts/outline";
import {Preview} from "./ts/preview/index";
import {Resize} from "./ts/resize/index";
import {Editor} from "./ts/sv/index";
import {formatRender2} from "./ts/sv2/formatRender";
// import {getSelectText2} from "./ts/sv2/getSelectText";
import {Editor2} from "./ts/sv2/index";
import {insertText2} from "./ts/sv2/insertText";
import {inputEvent} from "./ts/sv/inputEvent";
import {processAfterRender as processSVAfterRender} from "./ts/sv/process";
import {Tip} from "./ts/tip";
import {Toolbar} from "./ts/toolbar/index";
import {disableToolbar, hidePanel} from "./ts/toolbar/setToolbar";
import {enableToolbar} from "./ts/toolbar/setToolbar";
import {initUI} from "./ts/ui/initUI";
import {setCodeTheme} from "./ts/ui/setCodeTheme";
import {setContentTheme} from "./ts/ui/setContentTheme";
import {setPreviewMode} from "./ts/ui/setPreviewMode";
import {setTheme} from "./ts/ui/setTheme";
import {Undo} from "./ts/undo";
import {Upload} from "./ts/upload/index";
import {addScript, addScriptSync} from "./ts/util/addScript";
import {getSelectText} from "./ts/util/getSelectText";
import {Options} from "./ts/util/Options";
import {processCodeRender} from "./ts/util/processCode";
import {getCursorPosition, getEditorRange} from "./ts/util/selection";
import {WYSIWYG} from "./ts/wysiwyg";
import {afterRenderEvent} from "./ts/wysiwyg/afterRenderEvent";
import {input} from "./ts/wysiwyg/input";
import {renderDomByMd} from "./ts/wysiwyg/renderDomByMd";

class Vditor extends VditorMethod {

    public readonly version: string;
    public vditor: IVditor;

    /**
     * @param id ????????? Vditor ????????????????????? ID???
     * @param options Vditor ??????
     */
    constructor(id: string | HTMLElement, options?: IOptions) {
        super();
        this.version = VDITOR_VERSION;

        if (typeof id === "string") {
            if (!options) {
                options = {
                    cache: {
                        id: `vditor${id}`,
                    },
                };
            } else if (!options.cache) {
                options.cache = {id: `vditor${id}`};
            } else if (!options.cache.id) {
                options.cache.id = `vditor${id}`;
            }
            id = document.getElementById(id);
        }

        const getOptions = new Options(options);
        const mergedOptions = getOptions.merge();

        if (!["en_US", "ja_JP", "ko_KR", "ru_RU", "zh_CN", "zh_TW"].includes(mergedOptions.lang)) {
            throw new Error("options.lang error, see https://ld246.com/article/1549638745630#options");
        }

        this.vditor = {
            currentMode: mergedOptions.mode,
            element: id,
            hint: new Hint(mergedOptions.hint.extend),
            lute: undefined,
            options: mergedOptions,
            originalInnerHTML: id.innerHTML,
            outline: new Outline(i18n[mergedOptions.lang].outline),
            tip: new Tip(),
        };

        this.vditor.sv = new Editor(this.vditor);
        this.vditor.sv2 = new Editor2(this.vditor);
        this.vditor.undo = new Undo();
        this.vditor.wysiwyg = new WYSIWYG(this.vditor);
        this.vditor.ir = new IR(this.vditor);
        this.vditor.toolbar = new Toolbar(this.vditor);

        if (mergedOptions.resize.enable) {
            this.vditor.resize = new Resize(this.vditor);
        }

        if (this.vditor.toolbar.elements.devtools) {
            this.vditor.devtools = new DevTools();
        }

        if (mergedOptions.upload.url || mergedOptions.upload.handler) {
            this.vditor.upload = new Upload();
        }

        addScript(options._lutePath || `${mergedOptions.cdn}/dist/js/lute/lute.min.js`, "vditorLuteScript")
            .then(() => {
                this.vditor.lute = setLute({
                    autoSpace: this.vditor.options.preview.markdown.autoSpace,
                    codeBlockPreview: this.vditor.options.preview.markdown.codeBlockPreview,
                    emojiSite: this.vditor.options.hint.emojiPath,
                    emojis: this.vditor.options.hint.emoji,
                    fixTermTypo: this.vditor.options.preview.markdown.fixTermTypo,
                    footnotes: this.vditor.options.preview.markdown.footnotes,
                    headingAnchor: false,
                    inlineMathDigit: this.vditor.options.preview.math.inlineDigit,
                    linkBase: this.vditor.options.preview.markdown.linkBase,
                    linkPrefix: this.vditor.options.preview.markdown.linkPrefix,
                    listStyle: this.vditor.options.preview.markdown.listStyle,
                    mark: this.vditor.options.preview.markdown.mark,
                    mathBlockPreview: this.vditor.options.preview.markdown.mathBlockPreview,
                    paragraphBeginningSpace: this.vditor.options.preview.markdown.paragraphBeginningSpace,
                    sanitize: this.vditor.options.preview.markdown.sanitize,
                    toc: this.vditor.options.preview.markdown.toc,
                });

                this.vditor.preview = new Preview(this.vditor);

                initUI(this.vditor);

                if (mergedOptions.after) {
                    mergedOptions.after();
                }
                if (mergedOptions.icon) {
                    // ??????????????? 2 ????????????????????? 2 ???
                    addScriptSync(`${mergedOptions.cdn}/dist/js/icons/${mergedOptions.icon}.js`, "vditorIconScript");
                }
            });
    }

    /** ???????????? */
    public setTheme(theme: "dark" | "classic", contentTheme?: string, codeTheme?: string, contentThemePath?: string) {
        this.vditor.options.theme = theme;
        setTheme(this.vditor);
        if (contentTheme) {
            this.vditor.options.preview.theme.current = contentTheme;
            setContentTheme(contentTheme, contentThemePath || this.vditor.options.preview.theme.path);
        }
        if (codeTheme) {
            this.vditor.options.preview.hljs.style = codeTheme;
            setCodeTheme(codeTheme, this.vditor.options.cdn);
        }
    }

    /** ?????? Markdown ?????? */
    public getValue() {
        return getMarkdown(this.vditor);
    }

    /** ????????????????????????????????? */
    public getCurrentMode() {
        return this.vditor.currentMode;
    }

    /** ?????????????????? */
    public focus() {
        if (this.vditor.currentMode === "sv") {
            this.vditor.sv.element.focus();
        } else if (this.vditor.currentMode === "sv2") {
            this.vditor.sv2.element.focus();
        } else if (this.vditor.currentMode === "wysiwyg") {
            this.vditor.wysiwyg.element.focus();
        } else if (this.vditor.currentMode === "ir") {
            this.vditor.ir.element.focus();
        }
    }

    /** ?????????????????? */
    public blur() {
        if (this.vditor.currentMode === "sv") {
            this.vditor.sv.element.blur();
        } else if (this.vditor.currentMode === "sv2") {
            this.vditor.sv2.element.blur();
        } else if (this.vditor.currentMode === "wysiwyg") {
            this.vditor.wysiwyg.element.blur();
        } else if (this.vditor.currentMode === "ir") {
            this.vditor.ir.element.blur();
        }
    }

    /** ??????????????? */
    public disabled() {
        hidePanel(this.vditor, ["subToolbar", "hint", "popover"]);
        disableToolbar(this.vditor.toolbar.elements, Constants.EDIT_TOOLBARS.concat(["undo", "redo", "fullscreen",
            "edit-mode"]));
        this.vditor[this.vditor.currentMode].element.setAttribute("contenteditable", "false");
    }

    /** ????????????????????? */
    public enable() {
        enableToolbar(this.vditor.toolbar.elements, Constants.EDIT_TOOLBARS.concat(["undo", "redo", "fullscreen",
            "edit-mode"]));
        this.vditor.undo.resetIcon(this.vditor);
        this.vditor[this.vditor.currentMode].element.setAttribute("contenteditable", "true");
    }

    /** ???????????????????????? */
    public getSelection() {
        if (this.vditor.currentMode === "wysiwyg") {
            return getSelectText(this.vditor.wysiwyg.element);
        } else if (this.vditor.currentMode === "sv") {
            return getSelectText(this.vditor.sv.element);
        } else if (this.vditor.currentMode === "sv2") {
            return getSelectText(this.vditor.sv2.element);
        } else if (this.vditor.currentMode === "ir") {
            return getSelectText(this.vditor.ir.element);
        }
    }

    /** ???????????????????????? */
    public renderPreview(value?: string) {
        this.vditor.preview.render(this.vditor, value);
    }

    /** ?????????????????? */
    public getCursorPosition() {
        return getCursorPosition(this.vditor[this.vditor.currentMode].element);
    }

    /** ??????????????????????????? */
    public isUploading() {
        return this.vditor.upload.isUploading;
    }

    /** ???????????? */
    public clearCache() {
        localStorage.removeItem(this.vditor.options.cache.id);
    }

    /** ???????????? */
    public disabledCache() {
        this.vditor.options.cache.enable = false;
    }

    /** ???????????? */
    public enableCache() {
        if (!this.vditor.options.cache.id) {
            throw new Error("need options.cache.id, see https://ld246.com/article/1549638745630#options");
            return;
        }
        this.vditor.options.cache.enable = true;
    }

    /** HTML ??? md */
    public html2md(value: string) {
        return this.vditor.lute.HTML2Md(value);
    }

    /** ?????? HTML */
    public getHTML() {
        return getHTML(this.vditor);
    }

    /** ???????????????time ??? 0 ??????????????? */
    public tip(text: string, time?: number) {
        this.vditor.tip.show(text, time);
    }

    /** ?????????????????? */
    public setPreviewMode(mode: "both" | "editor") {
        setPreviewMode(mode, this.vditor);
    }

    /** ?????????????????? */
    public deleteValue() {
        if (window.getSelection().isCollapsed) {
            return;
        }
        if (this.vditor.currentMode === "sv2") {
            insertText2(this.vditor, "", "", true);
        } else {
            document.execCommand("delete", false);
        }
    }

    /** ?????????????????? */
    public updateValue(value: string) {
        if (this.vditor.currentMode === "sv2") {
            insertText2(this.vditor, value, "", true);
        } else {
            document.execCommand("insertHTML", false, value);
        }
    }

    /** ?????????????????????????????????????????? Markdown ?????? */
    public insertValue(value: string, render = true) {
        const range = getEditorRange(this.vditor);
        range.collapse(true);
        const tmpElement = document.createElement("template");
        tmpElement.innerHTML = value;
        range.insertNode(tmpElement.content.cloneNode(true));
        if (this.vditor.currentMode === "sv") {
            this.vditor.sv.preventInput = true;
            if (render) {
                inputEvent(this.vditor);
            }
        } else if (this.vditor.currentMode === "sv2") {
            insertText2(this.vditor, value, "");
        } else if (this.vditor.currentMode === "wysiwyg") {
            this.vditor.wysiwyg.preventInput = true;
            if (render) {
                input(this.vditor, getSelection().getRangeAt(0));
            }
        } else if (this.vditor.currentMode === "ir") {
            this.vditor.ir.preventInput = true;
            if (render) {
                irInput(this.vditor, getSelection().getRangeAt(0), true);
            }
        }
    }

    /** ????????????????????? */
    public setValue(markdown: string, clearStack = false) {
        if (this.vditor.currentMode === "sv") {
            this.vditor.sv.element.innerHTML = this.vditor.lute.SpinVditorSVDOM(markdown);
            processSVAfterRender(this.vditor, {
                enableAddUndoStack: true,
                enableHint: false,
                enableInput: false,
            });
        } else if (this.vditor.currentMode === "sv2") {
            formatRender2(this.vditor, markdown, {
                end: markdown.length,
                start: markdown.length,
            }, {
                enableAddUndoStack: !clearStack,
                enableHint: false,
                enableInput: false,
            });
        } else if (this.vditor.currentMode === "wysiwyg") {
            renderDomByMd(this.vditor, markdown, {
                enableAddUndoStack: true,
                enableHint: false,
                enableInput: false,
            });
        } else {
            this.vditor.ir.element.innerHTML = this.vditor.lute.Md2VditorIRDOM(markdown);
            this.vditor.ir.element.querySelectorAll(".vditor-ir__preview[data-render='2']").forEach(
                (item: HTMLElement) => {
                    processCodeRender(item, this.vditor);
                });
            processAfterRender(this.vditor, {
                enableAddUndoStack: true,
                enableHint: false,
                enableInput: false,
            });
        }

        this.vditor.outline.render(this.vditor);

        if (!markdown) {
            hidePanel(this.vditor, ["emoji", "headings", "submenu", "hint"]);
            if (this.vditor.wysiwyg.popover) {
                this.vditor.wysiwyg.popover.style.display = "none";
            }
            this.clearCache();
        }
        if (clearStack) {
            this.clearStack();
        }
    }

    /** ?????? undo & redo ??? */
    public clearStack() {
        this.vditor.undo.clearStack(this.vditor);
        this.vditor.undo.addToUndoStack(this.vditor);
    }

    /** ??????????????? */
    public destroy() {
        this.vditor.element.innerHTML = this.vditor.originalInnerHTML;
        this.vditor.element.classList.remove("vditor");
        this.vditor.element.removeAttribute("style");
        document.getElementById("vditorIconScript").remove();
        this.clearCache();
    }

    /** ???????????? ID */
    public getCommentIds() {
        if (this.vditor.currentMode !== "wysiwyg") {
            return [];
        }
        return this.vditor.wysiwyg.getComments(this.vditor, true);
    }

    /** ???????????? */
    public hlCommentIds(ids: string[]) {
        if (this.vditor.currentMode !== "wysiwyg") {
            return;
        }
        const hlItem = (item: Element) => {
            item.classList.remove("vditor-comment--hover");
            ids.forEach((id) => {
                if (item.getAttribute("data-cmtids").indexOf(id) > -1) {
                    item.classList.add("vditor-comment--hover");
                }
            });
        };
        this.vditor.wysiwyg.element.querySelectorAll(".vditor-comment").forEach((item) => {
            hlItem(item);
        });
        if (this.vditor.preview.element.style.display !== "none") {
            this.vditor.preview.element.querySelectorAll(".vditor-comment").forEach((item) => {
                hlItem(item);
            });
        }
    }

    /** ?????????????????? */
    public unHlCommentIds(ids: string[]) {
        if (this.vditor.currentMode !== "wysiwyg") {
            return;
        }
        const unHlItem = (item: Element) => {
            ids.forEach((id) => {
                if (item.getAttribute("data-cmtids").indexOf(id) > -1) {
                    item.classList.remove("vditor-comment--hover");
                }
            });
        };
        this.vditor.wysiwyg.element.querySelectorAll(".vditor-comment").forEach((item) => {
            unHlItem(item);
        });
        if (this.vditor.preview.element.style.display !== "none") {
            this.vditor.preview.element.querySelectorAll(".vditor-comment").forEach((item) => {
                unHlItem(item);
            });
        }
    }

    /** ???????????? */
    public removeCommentIds(removeIds: string[]) {
        if (this.vditor.currentMode !== "wysiwyg") {
            return;
        }

        const removeItem = (item: Element, removeId: string) => {
            const ids = item.getAttribute("data-cmtids").split(" ");
            ids.find((id, index) => {
                if (id === removeId) {
                    ids.splice(index, 1);
                    return true;
                }
            });
            if (ids.length === 0) {
                item.outerHTML = item.innerHTML;
                getEditorRange(this.vditor).collapse(true);
            } else {
                item.setAttribute("data-cmtids", ids.join(" "));
            }
        };
        removeIds.forEach((removeId) => {
            this.vditor.wysiwyg.element.querySelectorAll(".vditor-comment").forEach((item) => {
                removeItem(item, removeId);
            });
            if (this.vditor.preview.element.style.display !== "none") {
                this.vditor.preview.element.querySelectorAll(".vditor-comment").forEach((item) => {
                    removeItem(item, removeId);
                });
            }
        });
        afterRenderEvent(this.vditor, {
            enableAddUndoStack: true,
            enableHint: false,
            enableInput: false,
        });
    }
}

export default Vditor;
