import React, { useState, useCallback } from 'react';
import Split from 'react-split';
import { Code2, Loader2 } from 'lucide-react';
import { LanguageSelector } from './components/LanguageSelector';
import { EditorPane } from './components/EditorPane';
import { SUPPORTED_LANGUAGES, DEFAULT_SOURCE_CODE } from './constants';
import type { TranslationResult } from './types';

const API_URL = 'http://localhost:5000';

function App() {
  const [sourceLanguage, setSourceLanguage] = useState(SUPPORTED_LANGUAGES[0].value);
  const [targetLanguage, setTargetLanguage] = useState(SUPPORTED_LANGUAGES[1].value);
  const [sourceCode, setSourceCode] = useState(DEFAULT_SOURCE_CODE);
  const [translationResult, setTranslationResult] = useState<TranslationResult>({ translatedCode: '' });
  const [isTranslating, setIsTranslating] = useState(false);

  const handleTranslate = useCallback(async () => {
    if (sourceLanguage === targetLanguage) {
      setTranslationResult({
        translatedCode: '',
        error: 'Source and target languages must be different'
      });
      return;
    }

    setIsTranslating(true);
    try {
      const response = await fetch(`${API_URL}/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceCode,
          sourceLanguage,
          targetLanguage,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Translation failed');
      }

      setTranslationResult({ translatedCode: data.translatedCode });
    } catch (error) {
      setTranslationResult({
        translatedCode: '',
        error: error instanceof Error ? error.message : 'Translation failed. Please try again.'
      });
    } finally {
      setIsTranslating(false);
    }
  }, [sourceLanguage, targetLanguage, sourceCode]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Code2 className="h-6 w-6 text-indigo-600" />
              <h1 className="text-xl font-semibold text-gray-900">Code Translator</h1>
            </div>
            <div className="flex items-center space-x-4">
              <LanguageSelector
                languages={SUPPORTED_LANGUAGES}
                selected={sourceLanguage}
                onChange={setSourceLanguage}
                label="From"
              />
              <LanguageSelector
                languages={SUPPORTED_LANGUAGES}
                selected={targetLanguage}
                onChange={setTargetLanguage}
                label="To"
              />
              <button
                onClick={handleTranslate}
                disabled={isTranslating}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isTranslating ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Translating...
                  </>
                ) : (
                  'Translate'
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-4">
        <div className="bg-white rounded-lg shadow h-[calc(100vh-8rem)] overflow-hidden">
          <Split
            className="split flex h-full"
            sizes={[50, 50]}
            minSize={200}
            gutterSize={8}
            gutterStyle={() => ({
              backgroundColor: '#f3f4f6'
            })}
          >
            <EditorPane
              value={sourceCode}
              onChange={(value) => setSourceCode(value || '')}
              language={sourceLanguage}
              title="Source Code"
            />
            <EditorPane
              value={translationResult.error || translationResult.translatedCode}
              language={targetLanguage}
              readOnly
              title="Translated Code"
            />
          </Split>
        </div>
      </main>
    </div>
  );
}

export default App;