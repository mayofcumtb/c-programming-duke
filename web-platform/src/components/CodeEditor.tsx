"use client";

import Editor, { OnMount } from "@monaco-editor/react";
import { AlertTriangle, Lock } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface CodeEditorProps {
  initialValue?: string;
  value?: string;
  onChange?: (value: string | undefined) => void;
  readOnly?: boolean;
}

export default function CodeEditor({ 
  initialValue = "", 
  value,
  onChange,
  readOnly = false 
}: CodeEditorProps) {
  // 使用 value 作为受控值，如果提供了 value 则使用 value，否则使用 initialValue
  const editorValue = value !== undefined ? value : initialValue;
  const [warning, setWarning] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cleanupMonacoDomListenersRef = useRef<(() => void) | null>(null);

  // 防作弊：清除警告
  useEffect(() => {
    if (warning) {
      const timer = setTimeout(() => setWarning(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [warning]);

  useEffect(() => {
    return () => {
      cleanupMonacoDomListenersRef.current?.();
      cleanupMonacoDomListenersRef.current = null;
    };
  }, []);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    // 只读模式不需要拦截复制粘贴
    if (readOnly) return;

    cleanupMonacoDomListenersRef.current?.();
    cleanupMonacoDomListenersRef.current = null;
    
    // 监听按键，拦截 Ctrl+C, Ctrl+V
    editor.onKeyDown((e) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      
      // Block Ctrl+V / Cmd+V
      if (isCmdOrCtrl && e.code === 'KeyV') {
        e.preventDefault();
        e.stopPropagation();
        setWarning("禁止粘贴！请手写代码以加深记忆。");
      }
      
      // Block Ctrl+C / Cmd+C
      if (isCmdOrCtrl && e.code === 'KeyC') {
        e.preventDefault();
        e.stopPropagation();
        setWarning("禁止复制！请专注当前练习。");
      }

      if (isCmdOrCtrl && e.code === 'KeyX') {
        e.preventDefault();
        e.stopPropagation();
        setWarning("禁止剪切！");
      }
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyV, () => {
      setWarning("禁止粘贴！请手写代码以加深记忆。");
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyC, () => {
      setWarning("禁止复制！请专注当前练习。");
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyX, () => {
      setWarning("禁止剪切！");
    });

    const domNode = editor.getDomNode();
    if (!domNode) return;

    const onPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setWarning("禁止粘贴！请手写代码。");
    };

    const onCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setWarning("禁止复制！");
    };

    const onCut = (e: ClipboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setWarning("禁止剪切！");
    };

    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setWarning("禁止拖拽内容！");
    };

    const onDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const onBeforeInput = (e: Event) => {
      const inputEvent = e as InputEvent;
      if (inputEvent.inputType === "insertFromPaste") {
        inputEvent.preventDefault();
        inputEvent.stopPropagation();
        setWarning("禁止粘贴！请手写代码。");
      }
      if (inputEvent.inputType === "insertFromDrop") {
        inputEvent.preventDefault();
        inputEvent.stopPropagation();
        setWarning("禁止拖拽内容！");
      }
    };

    domNode.addEventListener("paste", onPaste, true);
    domNode.addEventListener("copy", onCopy, true);
    domNode.addEventListener("cut", onCut, true);
    domNode.addEventListener("drop", onDrop, true);
    domNode.addEventListener("dragover", onDragOver, true);
    domNode.addEventListener("dragenter", onDragOver, true);
    domNode.addEventListener("beforeinput", onBeforeInput, true);

    cleanupMonacoDomListenersRef.current = () => {
      domNode.removeEventListener("paste", onPaste, true);
      domNode.removeEventListener("copy", onCopy, true);
      domNode.removeEventListener("cut", onCut, true);
      domNode.removeEventListener("drop", onDrop, true);
      domNode.removeEventListener("dragover", onDragOver, true);
      domNode.removeEventListener("dragenter", onDragOver, true);
      domNode.removeEventListener("beforeinput", onBeforeInput, true);
    };
  };

  // 全局拦截剪贴板事件（针对编辑区域外围）
  const handlePaste = (e: React.ClipboardEvent) => {
    if (readOnly) return;
    e.preventDefault();
    setWarning("禁止粘贴！请手写代码。");
  };

  const handleCopy = (e: React.ClipboardEvent) => {
    if (readOnly) return;
    e.preventDefault();
    setWarning("禁止复制！");
  };

  const handleCut = (e: React.ClipboardEvent) => {
    if (readOnly) return;
    e.preventDefault();
    setWarning("禁止剪切！");
  };

  return (
    <div 
      ref={containerRef}
      className="relative h-full w-full overflow-hidden"
      onPasteCapture={handlePaste}
      onCopyCapture={handleCopy}
      onCutCapture={handleCut}
      onDrop={(e) => {
        if (readOnly) return;
        e.preventDefault();
        setWarning("禁止拖拽文件！");
      }}
      onDragOver={(e) => e.preventDefault()}
    >
      {/* 警告弹窗 */}
      {warning && (
        <div className="absolute top-4 left-1/2 z-50 -translate-x-1/2 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-bold text-white shadow-lg">
            <AlertTriangle className="h-4 w-4" />
            {warning}
          </div>
        </div>
      )}

      {/* 只读模式提示 */}
      {readOnly && (
        <div className="absolute top-3 right-3 z-40 flex items-center gap-1.5 rounded-md bg-amber-500/20 px-2 py-1 text-xs text-amber-300">
          <Lock className="h-3 w-3" />
          只读文件
        </div>
      )}

      <div className="h-full">
        <Editor
          height="100%"
          defaultLanguage="c"
          value={editorValue}
          onChange={readOnly ? undefined : onChange}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Menlo', 'Monaco', 'Consolas', monospace",
            fontLigatures: true,
            contextmenu: false,
            dragAndDrop: false,
            copyWithSyntaxHighlighting: false,
            scrollbar: {
              vertical: "visible",
              horizontal: "visible",
              verticalScrollbarSize: 10,
              horizontalScrollbarSize: 10,
            },
            padding: { top: 16, bottom: 16 },
            readOnly: readOnly,
            lineNumbers: "on",
            renderLineHighlight: "all",
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: "on",
            smoothScrolling: true,
            bracketPairColorization: { enabled: true },
          }}
        />
      </div>
    </div>
  );
}
