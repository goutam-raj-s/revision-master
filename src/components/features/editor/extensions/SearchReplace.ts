import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { Node as PMNode } from "@tiptap/pm/model";

export const searchKey = new PluginKey("searchReplace");

export interface SearchResult {
  from: number;
  to: number;
}

interface SearchState {
  searchTerm: string;
  replaceTerm: string;
  caseSensitive: boolean;
  index: number;
  results: SearchResult[];
  decorations: DecorationSet;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findResults(doc: PMNode, term: string, caseSensitive: boolean): SearchResult[] {
  const results: SearchResult[] = [];
  if (!term) return results;
  let re: RegExp;
  try {
    re = new RegExp(escapeRegExp(term), caseSensitive ? "g" : "gi");
  } catch {
    return results;
  }
  doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return;
    const text = node.text;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      results.push({ from: pos + m.index, to: pos + m.index + m[0].length });
      if (m.index === re.lastIndex) re.lastIndex++;
    }
  });
  return results;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    searchReplace: {
      setSearchTerm: (term: string) => ReturnType;
      setReplaceTerm: (term: string) => ReturnType;
      toggleSearchCase: () => ReturnType;
      searchNext: () => ReturnType;
      searchPrev: () => ReturnType;
      replaceCurrent: () => ReturnType;
      replaceAll: () => ReturnType;
      clearSearch: () => ReturnType;
    };
  }
}

export const SearchReplace = Extension.create({
  name: "searchReplace",

  addProseMirrorPlugins() {
    return [
      new Plugin<SearchState>({
        key: searchKey,
        state: {
          init: () => ({
            searchTerm: "",
            replaceTerm: "",
            caseSensitive: false,
            index: 0,
            results: [],
            decorations: DecorationSet.empty,
          }),
          apply(tr, prev): SearchState {
            const meta = tr.getMeta(searchKey) as Partial<SearchState> | undefined;
            let next: SearchState = { ...prev };
            if (meta) next = { ...next, ...meta };

            if (meta || tr.docChanged) {
              const results = findResults(tr.doc, next.searchTerm, next.caseSensitive);
              let index = next.index;
              if (index >= results.length) index = results.length > 0 ? results.length - 1 : 0;
              if (index < 0) index = 0;
              const decos =
                results.length > 0
                  ? DecorationSet.create(
                      tr.doc,
                      results.map((r, i) =>
                        Decoration.inline(r.from, r.to, {
                          class:
                            i === index ? "search-result search-result-current" : "search-result",
                        })
                      )
                    )
                  : DecorationSet.empty;
              next = { ...next, results, index, decorations: decos };
            }
            return next;
          },
        },
        props: {
          decorations(state) {
            return searchKey.getState(state)?.decorations ?? DecorationSet.empty;
          },
        },
      }),
    ];
  },

  addCommands() {
    return {
      setSearchTerm:
        (term: string) =>
        ({ state, dispatch }) => {
          if (dispatch) dispatch(state.tr.setMeta(searchKey, { searchTerm: term, index: 0 }));
          return true;
        },
      setReplaceTerm:
        (term: string) =>
        ({ state, dispatch }) => {
          if (dispatch) dispatch(state.tr.setMeta(searchKey, { replaceTerm: term }));
          return true;
        },
      toggleSearchCase:
        () =>
        ({ state, dispatch }) => {
          const cur = searchKey.getState(state);
          if (dispatch)
            dispatch(state.tr.setMeta(searchKey, { caseSensitive: !cur?.caseSensitive, index: 0 }));
          return true;
        },
      searchNext:
        () =>
        ({ state, dispatch }) => {
          const s = searchKey.getState(state);
          if (!s || s.results.length === 0) return false;
          const index = (s.index + 1) % s.results.length;
          if (dispatch) dispatch(scrollToResult(state, index));
          return true;
        },
      searchPrev:
        () =>
        ({ state, dispatch }) => {
          const s = searchKey.getState(state);
          if (!s || s.results.length === 0) return false;
          const index = (s.index + s.results.length - 1) % s.results.length;
          if (dispatch) dispatch(scrollToResult(state, index));
          return true;
        },
      replaceCurrent:
        () =>
        ({ state, dispatch }) => {
          const s = searchKey.getState(state);
          if (!s || s.results.length === 0) return false;
          const target = s.results[s.index];
          if (!target) return false;
          if (dispatch) {
            const tr = state.tr.insertText(s.replaceTerm, target.from, target.to);
            tr.setMeta(searchKey, {});
            dispatch(tr);
          }
          return true;
        },
      replaceAll:
        () =>
        ({ state, dispatch }) => {
          const s = searchKey.getState(state);
          if (!s || s.results.length === 0) return false;
          if (dispatch) {
            const tr = state.tr;
            // Replace from last to first so earlier positions stay valid.
            for (let i = s.results.length - 1; i >= 0; i--) {
              const r = s.results[i];
              tr.insertText(s.replaceTerm, r.from, r.to);
            }
            tr.setMeta(searchKey, { index: 0 });
            dispatch(tr);
          }
          return true;
        },
      clearSearch:
        () =>
        ({ state, dispatch }) => {
          if (dispatch)
            dispatch(state.tr.setMeta(searchKey, { searchTerm: "", results: [], index: 0 }));
          return true;
        },
    };
  },
});

import type { EditorState, Transaction } from "@tiptap/pm/state";

function scrollToResult(state: EditorState, index: number): Transaction {
  const tr = state.tr.setMeta(searchKey, { index });
  return tr;
}
