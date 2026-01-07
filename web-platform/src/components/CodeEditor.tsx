"use client";

import Editor, { OnMount } from "@monaco-editor/react";
import { AlertTriangle, Lock, ShieldAlert } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";

interface CodeEditorProps {
  initialValue?: string;
  value?: string;
  onChange?: (value: string | undefined) => void;
  readOnly?: boolean;
  problemId?: string;
  onCheatDetected?: (type: string, detail: string) => void;
  onResetRequired?: () => void;
}

// 作弊检测阈值
const SUSPICIOUS_CHAR_THRESHOLD = 50; // 单次增加超过50字符视为可疑
const SUSPICIOUS_LINE_THRESHOLD = 5;  // 单次增加超过5行视为可疑

export default function CodeEditor({ 
  initialValue = "", 
  value,
  onChange,
  readOnly = false,
  problemId,
  onCheatDetected,
  onResetRequired
}: CodeEditorProps) {
  // 使用 value 作为受控值，如果提供了 value 则使用 value，否则使用 initialValue
  const editorValue = value !== undefined ? value : initialValue;
  const [warning, setWarning] = useState<string | null>(null);
  const [cheatWarning, setCheatWarning] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cleanupMonacoDomListenersRef = useRef<(() => void) | null>(null);
  
  // 跟踪代码变化用于检测可疑粘贴
  const lastContentRef = useRef<string>(editorValue);
  const lastChangeTimeRef = useRef<number>(Date.now());
  const suspiciousCountRef = useRef<number>(0);

  // 报告作弊行为
  const reportCheat = useCallback((type: string, detail: string) => {
    console.warn(`[AntiCheat] ${type}: ${detail}`);
    onCheatDetected?.(type, detail);
    
    // 发送到服务器记录
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'cheat_detected',
        data: { type, detail, problemId, timestamp: Date.now() }
      })
    }).catch(() => {});
  }, [onCheatDetected, problemId]);

  // 检测可疑的代码变化（可能是外部粘贴）
  const detectSuspiciousChange = useCallback((newContent: string) => {
    const oldContent = lastContentRef.current;
    const timeDiff = Date.now() - lastChangeTimeRef.current;
    
    // 计算变化量
    const charDiff = newContent.length - oldContent.length;
    const newLines = newContent.split('\n').length;
    const oldLines = oldContent.split('\n').length;
    const lineDiff = newLines - oldLines;
    
    // 短时间内增加大量内容 = 可疑粘贴
    if (timeDiff < 500 && charDiff > SUSPICIOUS_CHAR_THRESHOLD) {
      suspiciousCountRef.current++;
      reportCheat('suspicious_paste', `短时间内增加 ${charDiff} 字符`);
      
      if (suspiciousCountRef.current >= 2) {
        setCheatWarning("检测到多次可疑操作！代码将被重置。");
        onResetRequired?.();
      } else {
        setWarning("检测到异常输入！请手写代码。再次违规将重置代码！");
      }
      return true;
    }
    
    // 单次增加大量行 = 可疑粘贴
    if (timeDiff < 1000 && lineDiff > SUSPICIOUS_LINE_THRESHOLD) {
      suspiciousCountRef.current++;
      reportCheat('suspicious_multiline', `短时间内增加 ${lineDiff} 行`);
      setWarning("检测到异常输入！请逐行编写代码。");
      return true;
    }
    
    lastContentRef.current = newContent;
    lastChangeTimeRef.current = Date.now();
    return false;
  }, [reportCheat, onResetRequired]);

  // 防作弊：清除警告
  useEffect(() => {
    if (warning) {
      const timer = setTimeout(() => setWarning(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [warning]);

  // 清除严重警告
  useEffect(() => {
    if (cheatWarning) {
      const timer = setTimeout(() => setCheatWarning(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [cheatWarning]);

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

      {/* 严重作弊警告 */}
      {cheatWarning && (
        <div className="absolute top-14 left-1/2 z-50 -translate-x-1/2 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-bold text-white shadow-lg border-2 border-orange-400">
            <ShieldAlert className="h-5 w-5" />
            {cheatWarning}
          </div>
        </div>
      )}

      <div className="h-full">
        <Editor
          height="100%"
          defaultLanguage="c"
          value={editorValue}
          onChange={(newValue) => {
            if (readOnly) return;
            // 检测可疑变化
            if (newValue) {
              detectSuspiciousChange(newValue);
            }
            onChange?.(newValue);
          }}
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
