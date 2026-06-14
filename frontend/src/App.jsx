import React, { useState, useEffect } from "react";

export default function App() {
  const [activeTab, setActiveTab] = useState("notices");
  const [notices, setNotices] = useState([]);
  const [loadingNotices, setLoadingNotices] = useState(false);

  const [subject, setSubject] = useState("");
  const [unit, setUnit] = useState(1);
  const [syllabus, setSyllabus] = useState("");
  const [aiQuestions, setAiQuestions] = useState(null);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);

  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [username, setUsername] = useState(
    `student_${Math.floor(Math.random() * 9000 + 1000)}`
  );

  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isListeningMic, setIsListeningMic] = useState(false);
  const [currentSpeechText, setCurrentSpeechText] = useState("");
  const [currentSpeechTitle, setCurrentSpeechTitle] = useState("");
  const [textQueryInput, setTextQueryInput] = useState("");
  const [processingAiResponse, setProcessingAiResponse] = useState(false);

  const [reviewsList, setReviewsList] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewToast, setReviewToast] = useState(null); // { type: 'success' | 'error', message: string }
  const [newReviewUser, setNewReviewUser] = useState("");
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [hoveredStarRating, setHoveredStarRating] = useState(0);
  const [newReviewComment, setNewReviewComment] = useState("");
  const [newReviewImage, setNewReviewImage] = useState(null);

  const [newsletterEmail, setNewsletterEmail] = useState("");



  const fetchStoredReviewsFromDb = async () => {
    setLoadingReviews(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/reviews");
      const data = await res.json();
      // Yahan filter laga diya hai taaki sirf sahi object wala data dikhe aur string hat jaye
      if (Array.isArray(data)) {
        const isJunkValue = (val) => {
          if (!val) return true;
          const v = String(val).trim().toLowerCase();
          return v === "" || v === "string";
        };

        const cleanData = data
          .filter(item =>
            item &&
            typeof item === 'object' &&
            !isJunkValue(item.user) &&
            !isJunkValue(item.comment)
          )
          .map(item => ({
            ...item,
            // Sirf valid base64/URL images dikhao, "string" jaisa placeholder text nahi
            image: item.image && /^(data:image\/|https?:\/\/)/.test(item.image) ? item.image : null
          }))
          // Sabse naya review sabse upar dikhayein
          .slice()
          .reverse();
        setReviewsList(cleanData);
      }
    } catch (err) {
      console.error("Database connection dropped for reviews fetching:", err);
    }
    setLoadingReviews(false);
  };

  // Page load par browser tab ka title aur favicon set karo
  // (App.jsx ke andar hi, taaki index.html edit karne ki zaroorat na pade)
  useEffect(() => {
    document.title = "AKTU AI Academic Hub";

    const faviconSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
        <defs>
          <linearGradient id="aktuGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#22d3ee"/>
            <stop offset="100%" stop-color="#c084fc"/>
          </linearGradient>
        </defs>
        <rect width="24" height="24" rx="5" fill="#04060a"/>
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
              stroke="url(#aktuGradient)" stroke-width="2.5"
              stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      </svg>
    `;
    const faviconUrl = `data:image/svg+xml,${encodeURIComponent(faviconSvg)}`;

    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.type = "image/svg+xml";
    link.href = faviconUrl;
  }, []);

  // Page load / refresh hone par hi DB se latest reviews fetch karo
  // taaki reviews refresh ke baad bhi gayab na ho (fully dynamic & persistent)
  useEffect(() => {
    fetchStoredReviewsFromDb();
  }, []);

  // Review submit ke baad dikhne wala toast khud-ba-khud hide ho jaye
  useEffect(() => {
    if (!reviewToast) return;
    const timer = setTimeout(() => setReviewToast(null), 3500);
    return () => clearTimeout(timer);
  }, [reviewToast]);

  const fetchAiNotices = async () => {
    setLoadingNotices(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/ai/notices");
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setNotices(data);
      } else {
        throw new Error("Trigger offline fallback arrays");
      }
    } catch (err) {
      setNotices([
        {
          title: "Regarding Examination Centers Allocation and Institution Mapping Scheme for Odd Semester Carry Over Theory Examinations 2026",
          link: "https://aktu.ac.in",
          category: "Exam",
          summary: "The Controller of Examinations has finalized the designated evaluation centers matrix. All affiliated institutions are instructed to download and verify local candidate seating setups immediately.",
          urgency: "High"
        },
        {
          title: "Notification for Filling Online Examination Forms for Regular and Carry Over Subjects of Even Semester Academic Sessions",
          link: "https://aktu.ac.in",
          category: "General",
          summary: "The university ERP portal dashboard link is officially active for student profile validation and course registrations. Late submissions will attract institutional penalties.",
          urgency: "High"
        }
      ]);
    }
    setLoadingNotices(false);
  };

  useEffect(() => {
    if (activeTab === "notices") fetchAiNotices();
  }, [activeTab]);

  const handleGenerateQuestions = async (e) => {
    if(e) e.preventDefault();
    if (!subject) return alert("Please specify Subject Name!");
    setGeneratingQuestions(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/ai/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject_name: subject,
          unit_number: parseInt(unit),
          syllabus_context: syllabus || "Core concepts overview.",
        }),
      });
      const data = await res.json();
      setAiQuestions(data);
    } catch (err) {
      setAiQuestions({
        core_7_mark_questions: [
          `Analyze the structural constraints, boundary conditions, and efficiency optimizations matching ${subject}. [AKTU End-Sem 2024-25]`,
          `Derive the complete mathematical recurrence model tracking system state variables for this unit domain. [AKTU End-Sem 2023-24]`
        ],
        short_2_mark_questions: [
          { question: `Define the primary conceptual limitation of standard ${subject} environments.`, answer: "It maps the maximum throughput boundary capacities slowing instruction processing threads." }
        ]
      });
    }
    setGeneratingQuestions(false);
  };

  const executeTextToSpeech = (title, summaryText) => {
    if (!("speechSynthesis" in window)) return alert("Audio framework connection error.");
    window.speechSynthesis.cancel();

    setCurrentSpeechTitle(title);
    setCurrentSpeechText(summaryText);
    setShowVoiceModal(true);
    setIsPaused(false);

    const utterance = new SpeechSynthesisUtterance(summaryText.replace(/\[.*?\]/g, ""));
    utterance.rate = 0.95;
    
    const availableSystemVoices = window.speechSynthesis.getVoices();
    if (availableSystemVoices.length > 0) {
      const targetVoice = availableSystemVoices.find(v => v.lang.includes("en-US") || v.lang.includes("en-GB")) || availableSystemVoices[0];
      utterance.voice = targetVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => { setIsSpeaking(false); setShowVoiceModal(false); };
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const submitQueryToConversationalAi = async (textQuery) => {
    if (!textQuery.trim()) return;
    setProcessingAiResponse(true);
    setCurrentSpeechTitle("Processing Query");
    setCurrentSpeechText(`Transmitting payload to conversational model: "${textQuery}"...`);
    setShowVoiceModal(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/ai/voice-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: textQuery })
      });
      const data = await res.json();
      setProcessingAiResponse(false);
      executeTextToSpeech(`AI Response Matrix`, data.response);
    } catch (err) {
      setProcessingAiResponse(false);
      executeTextToSpeech(`Engine Redirection`, `Parsed payload successfully but encountered backend socket timeout.`);
    }
  };

  const startVoiceCapturePipeline = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("System browser micro-channels locked.");

    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListeningMic(true);
      setCurrentSpeechTitle("Conversational Interface Active");
      setCurrentSpeechText("Lobby channels listening. Describe your query aloud now...");
      setShowVoiceModal(true);
    };

    recognition.onend = () => { setIsListeningMic(false); };

    recognition.onresult = (event) => {
      const capturedTranscript = event.results[0][0].transcript;
      setIsListeningMic(false);
      submitQueryToConversationalAi(capturedTranscript);
    };

    recognition.start();
  };

  const handleReviewImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewReviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!newReviewUser.trim() || !newReviewComment.trim()) {
      setReviewToast({ type: "error", message: "Please fill out your Name and Feedback message!" });
      return;
    }

    const payload = {
      user: newReviewUser,
      rating: newReviewRating,
      comment: newReviewComment,
      image: newReviewImage
    };

    setSubmittingReview(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        // Form reset karo
        setNewReviewUser("");
        setNewReviewComment("");
        setNewReviewImage(null);
        setNewReviewRating(5);

        // Database se taza (latest) reviews list dobara fetch karo,
        // taaki list hamesha database ke saath sync rahe
        // aur refresh ke baad bhi review gayab na ho.
        await fetchStoredReviewsFromDb();

        setReviewToast({ type: "success", message: "Review submitted and saved successfully!" });
      } else {
        setReviewToast({ type: "error", message: "Server rejected the review. Please try again." });
      }
    } catch (err) {
      setReviewToast({ type: "error", message: "Could not reach the server. Check your connection." });
    }
    setSubmittingReview(false);
  };

  const handleNewsletterSubscribe = async () => {
    if (!newsletterEmail.trim()) return;
    try {
      const res = await fetch("http://127.0.0.1:8000/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newsletterEmail })
      });
      const msg = await res.json();
      alert(msg.message);
      setNewsletterEmail("");
    } catch (err) {
      alert("Newsletter routing frame drops encountered.");
    }
  };

  const stopTalkingEngineFully = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    setIsListeningMic(false);
    setShowVoiceModal(false);
    setTextQueryInput("");
  };

  return (
    <>
      <div className="min-h-screen bg-[#04060a] text-slate-200 font-sans antialiased flex flex-col justify-between selection:bg-cyan-500/30 selection:text-cyan-400">
        
        <header className="w-full border-b border-slate-800/80 bg-[#04060a]/90 backdrop-blur-xl px-6 md:px-12 py-4 flex flex-col lg:flex-row justify-between items-center gap-4 sticky top-0 z-50 shadow-lg">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            <h1 className="text-lg font-black tracking-tight bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              AKTU AI Academic Hub
            </h1>
          </div>

          <div className="flex flex-wrap justify-center bg-slate-950/80 border border-slate-800/80 p-1.5 rounded-xl">
            {[
              { id: "notices", label: "University Circulars" },
              { id: "vault", label: "Examination Vault" },
              { id: "chats", label: "Peer Workspace" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-indigo-600 via-purple-600 to-purple-700 text-white shadow-lg"
                    : "text-slate-400 hover:text-cyan-400"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </header>

        {showVoiceModal && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-fadeIn">
            <div className="bg-[#070b14] border border-cyan-500/30 max-w-xl w-full p-6 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.15)] relative space-y-5">
              <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                <div className="space-y-1">
                  <span className={`text-[9px] uppercase font-mono tracking-widest px-2.5 py-0.5 rounded font-black ${isListeningMic ? "bg-red-950/60 text-red-400 border border-red-800/40 animate-pulse" : "bg-cyan-950/60 text-cyan-400 border border-cyan-800/40"}`}>
                    {isListeningMic ? "🎤 RECOGNITION ACTIVE" : processingAiResponse ? "⏳ COMPUTING ANSWER" : "Conversational HUD"}
                  </span>
                  <h3 className="text-sm font-bold text-slate-200 mt-1">{currentSpeechTitle}</h3>
                </div>
                <button onClick={stopTalkingEngineFully} className="text-slate-500 hover:text-red-400 text-sm font-bold font-mono cursor-pointer">&times; CLOSE</button>
              </div>

              <div className="flex items-end justify-center gap-1.5 h-14 bg-slate-950/60 border border-slate-900 rounded-xl p-4 overflow-hidden">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((bar) => (
                  <div
                    key={bar}
                    className={`w-1.5 bg-gradient-to-t from-indigo-500 to-cyan-400 rounded-full transition-all duration-300 ${(isSpeaking || isListeningMic || processingAiResponse) && !isPaused ? "animate-bounce h-full" : "h-2"}`}
                    style={{ animationDelay: `${bar * 0.07}s`, animationDuration: "0.4s" }}
                  ></div>
                ))}
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 text-xs text-slate-300 max-h-[110px] overflow-y-auto">
                {currentSpeechText}
              </div>

              <div className="pt-2 border-t border-slate-900 flex gap-2">
                <input
                  type="text"
                  value={textQueryInput}
                  onChange={(e) => setTextQueryInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && textQueryInput.trim() && submitQueryToConversationalAi(textQueryInput)}
                  placeholder="Ask a technical question or type an update parameter query..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-sans"
                />
                <button onClick={() => { if(textQueryInput.trim()) submitQueryToConversationalAi(textQueryInput); }} className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer shadow-md">Send</button>
              </div>
              <div className="flex justify-between items-center pt-1">
                <button onClick={startVoiceCapturePipeline} className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold font-mono tracking-wider flex items-center gap-1 cursor-pointer bg-slate-950 px-2.5 py-1.5 rounded border border-slate-900">🎤 Speak Question</button>
                <button onClick={stopTalkingEngineFully} className="bg-red-950/30 hover:bg-red-950 border border-red-900/50 px-4 py-1.5 rounded-xl text-xs font-bold text-red-400 cursor-pointer">Stop</button>
              </div>
            </div>
          </div>
        )}

        <main className="w-full flex-1 grid grid-cols-1 xl:grid-cols-4 p-4 md:p-8 gap-6 max-w-[1600px] mx-auto">
          <div className="xl:col-span-3 space-y-8">
            
            <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40 border border-slate-800/80 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
              <div className="space-y-1.5 max-w-xl text-center md:text-left">
                <h2 className="text-base font-black text-slate-100 tracking-tight">⚡ Bi-Directional Academic Automation Hub</h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Query the dynamic system database directly via speech inputs. Ask questions regarding university curriculum branches or exam parameters to generate real-time answers instantly.
                </p>
              </div>
              <button onClick={startVoiceCapturePipeline} className="bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 text-xs px-5 py-3 rounded-xl font-black uppercase cursor-pointer flex items-center gap-2 shadow-lg hover:scale-[1.02] transition-transform">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.42 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/></svg>
                <span>Talk with Hub</span>
              </button>
            </div>

            {activeTab === "notices" && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex justify-between items-center bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
                  <h3 className="text-xs font-black uppercase text-slate-300 tracking-wider font-mono">Verified Active Notification Lists</h3>
                  <button onClick={fetchAiNotices} className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black px-4 py-2 rounded-lg cursor-pointer transition-all">
                    <span>Sync Live Portal</span>
                  </button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {notices.map((notice, idx) => (
                    <div key={idx} className="p-5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 relative flex flex-col justify-between shadow-lg group duration-300">
                      <span className="absolute top-3 right-3 text-[8px] font-black px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded font-mono uppercase">{notice.urgency}</span>
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] bg-slate-900 text-cyan-400 font-bold uppercase px-2 py-0.5 rounded border border-slate-800 font-mono">{notice.category}</span>
                          <button onClick={() => executeTextToSpeech(notice.title, notice.summary)} className="text-[9px] text-purple-400 hover:text-cyan-400 font-black cursor-pointer bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-md">🔊 Listen Summary</button>
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-200 line-clamp-2">{notice.title}</h4>
                        <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800/40">
                          <p className="text-xs text-slate-400 leading-relaxed font-sans">{notice.summary}</p>
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-800/60">
                        <a href={notice.link} target="_blank" rel="noreferrer" className="text-xs text-cyan-400 font-black flex items-center gap-1.5"><svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg><span>Open Official PDF Document Asset</span></a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "vault" && (
              <div className="grid md:grid-cols-3 gap-6 animate-fadeIn">
                <form onSubmit={handleGenerateQuestions} className="bg-slate-950/60 border border-slate-800 p-5 rounded-xl space-y-4 h-fit shadow-xl">
                  <h3 className="text-xs font-black uppercase text-slate-300 tracking-wider font-mono">Vault Settings</h3>
                  <hr className="border-slate-800/60" />
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Subject Title</label>
                    <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g., Data Structures" className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-cyan-500 text-slate-100 font-sans" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Target Unit</label>
                    <select value={unit} onChange={(e) => setUnit(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-cyan-500 text-slate-200 cursor-pointer">
                      {[1,2,3,4,5].map(n => <option key={n} value={n}>Unit 0{n}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Curriculum Topics Spec</label>
                    <textarea rows="4" value={syllabus} onChange={(e) => setSyllabus(e.target.value)} placeholder="Paste textbook criteria description keys here..." className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 resize-none focus:outline-none" />
                  </div>
                  <button type="submit" disabled={generatingQuestions} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-black uppercase py-2.5 rounded-lg cursor-pointer">
                    {generatingQuestions ? "Compiling Matrix Model..." : "⚡ Generate Blueprint"}
                  </button>
                </form>

                <div className="md:col-span-2 space-y-4">
                  {!aiQuestions ? (
                    <div className="h-full min-h-[320px] border border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center text-slate-500 p-6 bg-slate-950/20 text-xs font-mono">Awaiting blueprint parameters validation stream inputs...</div>
                  ) : (
                    <div className="bg-slate-950/60 border border-slate-800 p-5 rounded-xl space-y-4 shadow-xl">
                      <h4 className="text-purple-400 font-black text-xs uppercase tracking-wider font-mono">Section B/C: Expected Mark High-Weightage Formulations</h4>
                      <ul className="space-y-2.5 text-xs text-slate-300">
                        {aiQuestions.core_7_mark_questions?.map((q, i) => (
                          <li key={i} className="bg-slate-900/90 p-3.5 rounded-lg border border-slate-800/80 flex items-start justify-between gap-3 shadow-inner">
                            <span className="leading-relaxed"><strong className="text-cyan-400 font-mono mr-1">0{i+1}.</strong> {q}</span>
                            <button onClick={() => executeTextToSpeech(`Question ${i+1}`, q)} className="text-[9px] text-slate-400 hover:text-cyan-400 border border-slate-800 px-1.5 py-0.5 rounded bg-slate-950 cursor-pointer font-mono font-bold shrink-0">🔊 Read</button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "chats" && (
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-8 text-center space-y-4 max-w-2xl mx-auto flex flex-col items-center">
                <p className="text-xs text-slate-500 font-mono">Lobby data communication sockets active.</p>
                <div className="flex w-full gap-2 max-w-md">
                  <input type="text" value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} placeholder="Type shared message context..." className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-100" />
                  <button onClick={() => { if(inputMessage.trim()) { setMessages([...messages, {sender: `@${username}`, message: inputMessage}]); setInputMessage(""); } }} className="bg-indigo-600 text-white px-5 rounded-xl text-xs font-bold uppercase cursor-pointer">Post</button>
                </div>
                <div className="space-y-2 w-full text-left max-h-[200px] overflow-y-auto">
                  {messages.map((m,i) => (
                    <div key={i} className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs">
                      <span className="text-purple-400 font-mono font-bold text-[9px] block">{m.sender}</span>
                      <span className="text-slate-300">{m.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-slate-950/40 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <span className="text-cyan-400">★</span> Student Review & Verification Feed
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Submit platform experiences, star counts, or grade scorecards cleanly</p>
                </div>
                <button
                  onClick={fetchStoredReviewsFromDb}
                  disabled={loadingReviews}
                  className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-cyan-400 text-[10px] font-black uppercase px-3 py-2 rounded-lg cursor-pointer transition-all shrink-0 disabled:opacity-50"
                >
                  {loadingReviews ? "Syncing..." : "↻ Refresh"}
                </button>
              </div>

              {reviewToast && (
                <div
                  className={`flex items-center justify-between gap-3 text-xs font-bold px-4 py-3 rounded-xl border animate-fadeIn ${
                    reviewToast.type === "success"
                      ? "bg-emerald-950/50 border-emerald-800/60 text-emerald-300"
                      : "bg-red-950/50 border-red-800/60 text-red-300"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{reviewToast.type === "success" ? "✅" : "⚠️"}</span>
                    <span>{reviewToast.message}</span>
                  </span>
                  <button
                    onClick={() => setReviewToast(null)}
                    className="text-current opacity-60 hover:opacity-100 cursor-pointer font-mono"
                  >
                    &times;
                  </button>
                </div>
              )}


              <div className="grid md:grid-cols-5 gap-6 items-start">
                <form onSubmit={handleReviewSubmit} className="md:col-span-2 bg-slate-950/80 border border-slate-800/80 p-4 rounded-xl space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Your Name / Branch</label>
                    <input
                      type="text"
                      value={newReviewUser}
                      onChange={(e) => setNewReviewUser(e.target.value)}
                      placeholder="e.g., Amit Sharma (B.Tech ECE)"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Select Star Rating</label>
                    <div className="flex items-center gap-1.5 bg-slate-900 p-2.5 rounded-lg border border-slate-800/80 w-fit">
                      {[1, 2, 3, 4, 5].map((starIndex) => {
                        const isGlowing = starIndex <= (hoveredStarRating || newReviewRating);
                        return (
                          <svg
                            key={starIndex}
                            onClick={() => setNewReviewRating(starIndex)}
                            onMouseEnter={() => setHoveredStarRating(starIndex)}
                            onMouseLeave={() => setHoveredStarRating(0)}
                            className={`w-6 h-6 cursor-pointer transition-all duration-150 transform hover:scale-110 ${
                              isGlowing ? "text-yellow-400 drop-shadow-[0_0_6px_rgba(234,179,8,0.5)]" : "text-slate-600"
                            }`}
                            viewBox="0 0 24 24"
                            fill={isGlowing ? "currentColor" : "none"}
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                        );
                      })}
                      <span className="text-[10px] font-mono text-slate-400 ml-2 uppercase font-bold">{newReviewRating}/5 selected</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Upload Scorecard / Image Asset</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleReviewImageChange}
                      className="w-full text-[10px] text-slate-400 file:bg-slate-900 file:border-slate-800 file:text-cyan-400 file:px-2.5 file:py-1 file:rounded-md file:mr-2 file:cursor-pointer transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Feedback Comment</label>
                    <textarea
                      rows="3"
                      value={newReviewComment}
                      onChange={(e) => setNewReviewComment(e.target.value)}
                      placeholder="Share your sessional or semester experience..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 resize-none focus:outline-none focus:border-cyan-500 font-sans"
                    />
                  </div>

                  {newReviewImage && (
                    <div className="relative w-14 h-14 border border-slate-800 rounded-lg overflow-hidden animate-fadeIn">
                      <img src={newReviewImage} alt="Preview" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setNewReviewImage(null)} className="absolute top-0 right-0 bg-red-600 text-white text-[8px] px-1 rounded-bl">&times;</button>
                    </div>
                  )}

                  <button type="submit" disabled={submittingReview} className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs uppercase py-2.5 rounded-xl transition-all cursor-pointer shadow-md disabled:opacity-60">
                    {submittingReview ? "Submitting..." : "Submit Platform Review"}
                  </button>
                </form>

                <div className="md:col-span-3 max-h-[480px] overflow-y-auto pr-1">
                  {loadingReviews ? (
                    <div className="h-full min-h-[180px] flex items-center justify-center text-slate-500 text-xs font-mono italic">
                      Syncing review records from SQL database...
                    </div>
                  ) : reviewsList.length === 0 ? (
                    <div className="h-full min-h-[180px] flex flex-col items-center justify-center text-center gap-2 border border-dashed border-slate-800 rounded-xl p-6">
                      <span className="text-2xl">📝</span>
                      <p className="text-xs text-slate-500 font-mono">No reviews yet — be the first to share your experience!</p>
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-4">
                      {reviewsList.map((rev, idx) => (
                        <div
                          key={rev.id ?? idx}
                          className="bg-slate-900/80 border border-slate-700/80 rounded-2xl p-4 shadow-lg shadow-black/30 hover:border-cyan-500/50 hover:bg-slate-900 transition-all duration-300 flex flex-col gap-3"
                        >
                          <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 shadow-md overflow-hidden">
                              {rev.image ? (
                                <img src={rev.image} alt={rev.user} className="w-full h-full object-cover" />
                              ) : (
                                <svg className="w-5 h-5 text-slate-400" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M12 12c2.7 0 8 1.34 8 4v2H4v-2c0-2.66 5.3-4 8-4zm0-2a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
                                </svg>
                              )}
                            </div>
                            <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                              <h5 className="text-xs font-bold text-slate-100 font-mono truncate">{rev.user}</h5>
                              <span className="text-[11px] text-yellow-400 font-mono tracking-wide">{"★".repeat(rev.rating)}{"☆".repeat(5 - rev.rating)}</span>
                            </div>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed italic flex-1">"{rev.comment}"</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-slate-950 via-[#0a0f1d] to-slate-950 border border-slate-800/80 p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
              <div className="space-y-1 text-center md:text-left">
                <h4 className="text-xs font-black uppercase text-slate-200 tracking-wider font-mono">Subscribe to Academic Bulletin</h4>
                <p className="text-[11px] text-slate-500">Get filtered high-urgency circular reports sent directly to your inbox cycles.</p>
              </div>
              <div className="flex w-full md:w-auto max-w-sm gap-2">
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="name@institution.edu"
                  className="w-full md:w-64 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                />
                <button 
                  onClick={handleNewsletterSubscribe}
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs px-4 py-2 rounded-xl font-black uppercase cursor-pointer tracking-wide transition-all shadow-md shrink-0"
                >
                  Join Feed
                </button>
              </div>
            </div>

          </div>

          <div className="xl:col-span-1 bg-slate-950/40 border border-slate-800 rounded-2xl p-4 flex flex-col h-fit xl:h-[calc(100vh-140px)] sticky top-24 shadow-2xl">
            <div className="border-b border-slate-800/80 pb-3 mb-4 flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 font-mono">
                <span className="h-1.5 w-1.5 bg-cyan-400 rounded-full shadow-[0_0_8px_#06b6d4] animate-ping"></span> Live Index Stream
              </h3>
              <svg className="w-4 h-4 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            </div>
            <div className="space-y-2 overflow-y-auto max-h-[250px] xl:max-h-none text-[11px] font-sans pr-1">
              {notices.map((n, i) => (
                <div key={i} className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/60 transition-all duration-300">
                  <span className="text-[8px] font-mono text-cyan-400 uppercase tracking-wider block font-mono">{n.category}</span>
                  <p className="text-slate-300 font-medium line-clamp-1 leading-normal font-sans">{n.title}</p>
                </div>
              ))}
            </div>
          </div>
        </main>

        <footer className="w-full border-t border-slate-900 bg-slate-950/40 mt-12 px-6 md:px-12 py-5 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} AKTU Academic Hub. Official Student Resource Node. All Curriculum Metadata Mapped.</p>
          <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl px-4 py-1.5 flex items-center gap-2 shadow-inner">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
            <p className="text-slate-400 text-[11px] font-sans">
              Designed & Developed by <span className="text-purple-400 font-black hover:text-cyan-400 transition-all duration-300 cursor-pointer">Pramudit Shukla</span>
            </p>
          </div>
        </footer>

      </div>
    </>
  );
}