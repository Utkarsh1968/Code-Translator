// import React from 'react';
import Editor from '@monaco-editor/react';

interface EditorPaneProps {
  value: string;
  onChange?: (value: string | undefined) => void;
  language: string;
  readOnly?: boolean;
  title: string;
}

const getMonacoLanguage = (language: string): string => {
  const languageMap: { [key: string]: string } = {
    Python: 'python',
    JavaScript: 'javascript',
    Java: 'java',
    'C++': 'cpp',
    'C#': 'csharp',
  };

  return languageMap[language] || 'plaintext'; // Default to plaintext if unknown
};

export function EditorPane({ value, onChange, language, readOnly = false, title }: EditorPaneProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="bg-gray-100 px-4 py-2 border-b">
        <h2 className="text-sm font-medium text-gray-700">{title}</h2>
      </div>
      <div className="flex-1">
      <Editor
  height="100%"
  language={getMonacoLanguage(language)} // Convert for Monaco
  value={value}
  onChange={onChange}
  theme="vs-dark"
  options={{
    minimap: { enabled: false },
    fontSize: 14,
    readOnly,
    scrollBeyondLastLine: false,
    automaticLayout: true,
    tabSize: 2,
    wordWrap: 'on',
    lineNumbers: 'on',
    renderWhitespace: 'selection',
    formatOnPaste: true,
    formatOnType: true,
  }}
/>
      </div>
    </div>
  );
}