import { Node, mergeAttributes } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    pageBreak: {
      /** Insert a manual page break at the current cursor position */
      insertPageBreak: () => ReturnType;
    };
  }
}

export const PageBreak = Node.create({
  name: "pageBreak",
  group: "block",
  atom: true,
  draggable: false,
  selectable: true,

  parseHTML() {
    return [{ tag: 'div[data-type="page-break"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "page-break",
        style:
          "display:flex;align-items:center;gap:8px;margin:4px 0;user-select:none;cursor:default;",
      }),
      [
        "div",
        {
          style:
            "flex:1;height:1px;background:repeating-linear-gradient(90deg,#d1d5db 0,#d1d5db 6px,transparent 6px,transparent 12px);",
        },
      ],
      [
        "span",
        {
          style:
            "font-size:10px;color:#9ca3af;white-space:nowrap;font-family:monospace;letter-spacing:.05em;padding:0 4px;",
        },
        "Page Break",
      ],
      [
        "div",
        {
          style:
            "flex:1;height:1px;background:repeating-linear-gradient(90deg,#d1d5db 0,#d1d5db 6px,transparent 6px,transparent 12px);",
        },
      ],
    ];
  },

  addCommands() {
    return {
      insertPageBreak:
        () =>
        ({ commands }) => {
          return commands.insertContent([
            { type: this.name },
            { type: "paragraph" },
          ]);
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Enter": () => this.editor.commands.insertPageBreak(),
    };
  },
});
