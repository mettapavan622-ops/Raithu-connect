import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Mic,
  MicOff,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  Info,
  Calendar,
  Volume2
} from 'lucide-react';
import { apiFetch } from '../api';
import { ListingDraftResult } from '../../shared/types';

interface AiListingAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyDraft: (draft: ListingDraftResult) => void;
  farmerLocality?: string;
}

export const AiListingAssistantModal: React.FC<AiListingAssistantModalProps> = ({
  isOpen,
  onClose,
  onApplyDraft,
  farmerLocality,
}) => {
  const [inputText, setInputText] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<'te-IN' | 'hi-IN' | 'en-IN'>('te-IN');
  const [isListening, setIsListening] = useState(false);
  const [recognitionSupported, setRecognitionSupported] = useState(false);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<ListingDraftResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [speechNotice, setSpeechNotice] = useState<string | null>(null);

  // Check Web Speech API support
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setRecognitionSupported(!!SpeechRecognition);
  }, []);

  if (!isOpen) return null;

  const handleToggleVoice = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechNotice('Speech recognition is not supported in this browser. Please type directly into the box.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = selectedLanguage;
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechNotice(`Listening in ${selectedLanguage === 'te-IN' ? 'Telugu' : selectedLanguage === 'hi-IN' ? 'Hindi' : 'English'}... Speak your produce details.`);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText((prev) => (prev ? prev + ' ' + transcript : transcript));
        setIsListening(false);
        setSpeechNotice('Speech captured! Review text and click "Extract Listing Draft".');
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        setSpeechNotice(`Microphone error: ${event.error || 'Could not capture speech'}. You can type manually.`);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e: any) {
      setIsListening(false);
      setSpeechNotice('Microphone access unavailable. Please type manually.');
    }
  };

  const handleExtractDraft = async () => {
    if (!inputText || inputText.trim().length < 3) {
      setErrorMessage('Please type or speak your produce details first.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setDraft(null);

    try {
      const res = await apiFetch<{ draft: ListingDraftResult }>('/api/ai/draft-listing', {
        method: 'POST',
        body: JSON.stringify({
          input: inputText,
          farmerLocality: farmerLocality || 'Hyderabad Rural',
        }),
      });

      setDraft(res.draft);
    } catch (err: any) {
      setErrorMessage(
        err.message || 'AI assistant encountered an issue. You can still create the listing manually.'
      );
    } finally {
      setLoading(false);
    }
  };

  const sampleVoicePrompts = [
    {
      lang: 'Telugu',
      label: 'Tamata Harvest (Telugu)',
      text: 'Maa polam lo 80 kg naatu tamatalu unnayi. Repu koyataniki ready. Rate 35 rupees per kg. Shamshabad daggara pickup.',
    },
    {
      lang: 'Hindi',
      label: 'Palak Greens (Hindi)',
      text: 'Hamare paas subah 50 bunch taaza desi palak harvest hoga. 15 rupaye per bunch. Ibrahimpatnam farm gate pickup.',
    },
    {
      lang: 'English',
      label: 'Surplus Papaya (English)',
      text: 'We have 25 pieces ripe sweet papaya ready today in Shamshabad. 50 rupees each with 20 percent surplus clearance discount ending tomorrow evening.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-4">
      <div
        className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-stone-200 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-emerald-950 text-stone-100 px-6 py-4 flex items-center justify-between border-b border-emerald-900">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-serif text-lg font-bold text-stone-100">
                AI Listing Assistant
              </h3>
              <p className="text-[11px] text-stone-400">
                Multilingual draft extraction (Telugu • Hindi • English) via Gemini 3.8 Flash
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-100 p-1.5 rounded-lg hover:bg-emerald-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-5">
          {/* Strict Safety Notice */}
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Assisted Draft Mode:</span>
              AI never publishes automatically. It extracts details into an editable draft, resolves relative dates (like "repu" / "tomorrow") to Asia/Kolkata, and highlights any missing fields for you to review and confirm.
            </div>
          </div>

          {/* Voice Language Selector & Mic Controls */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-semibold text-xs text-stone-700">
                Spoken or Written Produce Details:
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-stone-500">Voice Language:</span>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value as any)}
                  className="text-xs bg-stone-100 border border-stone-300 rounded px-2 py-1 text-stone-800"
                >
                  <option value="te-IN">తెలుగు (Telugu)</option>
                  <option value="hi-IN">हिन्दी (Hindi)</option>
                  <option value="en-IN">English (India)</option>
                </select>
              </div>
            </div>

            {/* Input Box */}
            <div className="relative">
              <textarea
                rows={4}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Speak or type naturally in Telugu, Hindi, or English. E.g.: 'Maa daggara 50 kg vankayalu unnayi, repu morning harvest ready, 40 rupees per kg, Shamshabad pickup...'"
                className="w-full p-3 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-emerald-700"
              />

              <button
                type="button"
                onClick={handleToggleVoice}
                className={`absolute bottom-3 right-3 p-2 rounded-full shadow-sm flex items-center gap-1.5 text-xs font-semibold transition-colors ${
                  isListening
                    ? 'bg-red-600 text-white animate-pulse'
                    : 'bg-emerald-800 hover:bg-emerald-700 text-white'
                }`}
                title="Tap to speak"
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                <span className="hidden sm:inline">{isListening ? 'Listening...' : 'Voice Input'}</span>
              </button>
            </div>

            {speechNotice && (
              <p className="text-[11px] text-emerald-800 mt-1 italic">{speechNotice}</p>
            )}
          </div>

          {/* Sample Prompts */}
          <div>
            <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block mb-1.5">
              Quick Test Examples:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {sampleVoicePrompts.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setInputText(p.text)}
                  className="p-2 text-left bg-stone-50 hover:bg-emerald-50 rounded-lg border border-stone-200 text-[11px] transition-colors"
                >
                  <span className="font-bold text-emerald-900 block">{p.label}</span>
                  <span className="text-stone-500 line-clamp-2 text-[10px] mt-0.5">{p.text}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Action Trigger */}
          <button
            type="button"
            onClick={handleExtractDraft}
            disabled={loading || !inputText.trim()}
            className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-stone-300 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{loading ? 'Analyzing Farmer Transcript with Gemini 3.8 Flash...' : 'Extract Listing Draft'}</span>
          </button>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-300 rounded-xl text-xs text-red-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Notice:</span>
                {errorMessage}
                <p className="mt-1 text-stone-600">
                  You can close this assistant and enter your produce listing manually anytime.
                </p>
              </div>
            </div>
          )}

          {/* Extracted Structured Draft Preview */}
          {draft && (
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-300 space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                <span className="font-serif font-bold text-stone-900 text-sm">
                  Extracted Draft Review
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-900 font-semibold px-2 py-0.5 rounded">
                  Status: Ready for Farmer Confirmation
                </span>
              </div>

              {/* Missing Fields Warning */}
              {draft.missingFields.length > 0 && (
                <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-900">
                  <span className="font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                    Missing Fields (Farmer must specify manually):
                  </span>
                  <ul className="list-disc list-inside mt-1 text-[11px] text-amber-800">
                    {draft.missingFields.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Uncertainties Callout */}
              {draft.uncertainties.length > 0 && (
                <div className="p-2.5 bg-stone-100 border border-stone-300 rounded-lg text-xs text-stone-700">
                  <span className="font-bold block text-stone-900">Uncertainties detected in speech:</span>
                  <ul className="list-disc list-inside mt-1 text-[11px]">
                    {draft.uncertainties.map((u, i) => (
                      <li key={i}>{u}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Structured Extracted Key-Values */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-white p-3 rounded-lg border border-stone-200">
                <div>
                  <span className="text-stone-400 block text-[10px] uppercase font-bold">Produce Name:</span>
                  <span className="font-bold text-stone-900">{draft.productName || '⚠️ Not specified'}</span>
                </div>

                <div>
                  <span className="text-stone-400 block text-[10px] uppercase font-bold">Category:</span>
                  <span className="font-medium text-stone-800 capitalize">{draft.category || '⚠️ Not specified'}</span>
                </div>

                <div>
                  <span className="text-stone-400 block text-[10px] uppercase font-bold">Unit &amp; Quantity:</span>
                  <span className="font-bold text-stone-900">
                    {draft.quantity !== null && draft.unit
                      ? `${draft.unit === 'kg' ? draft.quantity / 1000 + ' kg' : draft.quantity + ' ' + draft.unit}`
                      : '⚠️ Not specified'}
                  </span>
                </div>

                <div>
                  <span className="text-stone-400 block text-[10px] uppercase font-bold">Price per Unit:</span>
                  <span className="font-bold text-emerald-850">
                    {draft.pricePerUnit ? `₹${draft.pricePerUnit} / ${draft.unit || 'unit'}` : '⚠️ Not specified'}
                  </span>
                </div>

                <div>
                  <span className="text-stone-400 block text-[10px] uppercase font-bold">Resolved Harvest Date:</span>
                  <span className="font-medium text-stone-800">{draft.harvestDate || '⚠️ Not specified'}</span>
                </div>

                <div>
                  <span className="text-stone-400 block text-[10px] uppercase font-bold">Pickup Locality:</span>
                  <span className="font-medium text-stone-800">{draft.pickupLocality || '⚠️ Not specified'}</span>
                </div>
              </div>

              {draft.description && (
                <div className="text-xs bg-white p-2.5 rounded-lg border border-stone-200 text-stone-700">
                  <span className="text-[10px] uppercase font-bold text-stone-400 block mb-0.5">Summary Note:</span>
                  {draft.description}
                </div>
              )}

              {/* Apply Draft to Create Form */}
              <button
                type="button"
                onClick={() => {
                  onApplyDraft(draft);
                  onClose();
                }}
                className="w-full py-2.5 bg-emerald-850 hover:bg-emerald-950 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                <span>Apply Extracted Data to Listing Form</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
