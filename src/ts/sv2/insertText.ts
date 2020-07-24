import {getMarkdown} from "../markdown/getMarkdown";
import {getEditorRange, getSelectPosition} from "./selection";
import {formatRender2} from "./formatRender";

export const insertText2 = (vditor: IVditor, prefix: string, suffix: string, replace: boolean = false,
                           toggle: boolean = false) => {
    const range = getEditorRange(vditor.sv2.element);

    const position = getSelectPosition(vditor.sv2.element, range);
    const content = getMarkdown(vditor);

    // select none || select something and need replace
    if (range.collapsed || (!range.collapsed && replace)) {
        const text = prefix + suffix;
        formatRender2(vditor, content.substring(0, position.start) + text + content.substring(position.end),
            {
                end: position.start + prefix.length,
                start: position.start + prefix.length,
            });
    } else {
        const selectText = content.substring(position.start, position.end);
        if (toggle && content.substring(position.start - prefix.length, position.start) === prefix
            && content.substring(position.end, position.end + suffix.length) === suffix) {
            formatRender2(vditor, content.substring(0, position.start - prefix.length)
                + selectText + content.substring(position.end + suffix.length),
                {
                    end: position.start - prefix.length + selectText.length,
                    start: position.start - prefix.length,
                });
        } else {
            const text = prefix + selectText + suffix;
            formatRender2(vditor, content.substring(0, position.start) + text + content.substring(position.end),
                {
                    end: position.start + prefix.length + selectText.length,
                    start: position.start + prefix.length,
                });
        }
    }
};
