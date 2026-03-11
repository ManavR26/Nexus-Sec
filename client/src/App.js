import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, Code2, Globe, Box, LayoutGrid, Download, Trash2, Github, 
  Activity, AlertTriangle, ChevronLeft, ChevronRight, Filter, X, Search, 
  TerminalSquare, Sparkles, Server, Zap, Bug, FileCode2, LogOut, Bell, 
  CheckCircle, XCircle, Info, Clock, FileText, Sliders, GripVertical, Send,
  Briefcase, ShieldCheck, Scale // <-- NEW ICONS FOR GRC
} from 'lucide-react';
// NEW IMPORTS FOR THE RADAR CHART
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

// ==========================================
// 🟢 MATRIX SPOTLIGHT BACKGROUND
// ==========================================
const MatrixBackground = () => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const binary = "01";
    const fontSize = 14;
    const columns = canvas.width / fontSize;
    const drops = Array(Math.floor(columns)).fill(1);

    const draw = () => {
      ctx.fillStyle = 'rgba(9, 9, 11, 0.1)'; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#10b981'; 
      ctx.font = fontSize + 'px monospace';
      
      for (let i = 0; i < drops.length; i++) {
        const text = binary[Math.floor(Math.random() * binary.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };
    
    const interval = setInterval(draw, 33);
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (containerRef.current) {
        containerRef.current.style.setProperty('--mouse-x', `${e.clientX}px`);
        containerRef.current.style.setProperty('--mouse-y', `${e.clientY}px`);
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-[1]"
      style={{
        '--mouse-x': '50vw',
        '--mouse-y': '50vh',
        maskImage: 'radial-gradient(circle 350px at var(--mouse-x) var(--mouse-y), black 0%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(circle 350px at var(--mouse-x) var(--mouse-y), black 0%, transparent 100%)',
      }}
    >
      <canvas ref={canvasRef} className="block w-full h-full opacity-30" />
    </div>
  );
};

// ==========================================
// 🚀 MAIN APPLICATION
// ==========================================
function App() {
  const GITHUB_CLIENT_ID = 'Ov23liXyjQdoLdOKk4lt';

  // --- CORE UI STATE ---
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [aiModal, setAiModal] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const messagesEndRef = useRef(null);
  const [isExportHovered, setIsExportHovered] = useState(false);

  // --- 🧠 AI STATE (Chat & Red Team PoC) ---
  const [aiModalTab, setAiModalTab] = useState('chat');
  const [chatHistories, setChatHistories] = useState(() => JSON.parse(localStorage.getItem('chatHistories')) || {});
  const [pocData, setPocData] = useState(() => JSON.parse(localStorage.getItem('pocData')) || {});
  const [pocLoading, setPocLoading] = useState(false);
  
  useEffect(() => { localStorage.setItem('chatHistories', JSON.stringify(chatHistories)); }, [chatHistories]);
  useEffect(() => { localStorage.setItem('pocData', JSON.stringify(pocData)); }, [pocData]);

  // --- NOTIFICATION SYSTEM ---
  const [notifications, setNotifications] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // --- GRC STATE ---
  const [currency, setCurrency] = useState('INR'); // Defaults to Rupees

  // --- THREAT TRIAGE ENGINE STATE ---
  const [isRuleEngineOpen, setIsRuleEngineOpen] = useState(false);
  const [customRules, setCustomRules] = useState(() => JSON.parse(localStorage.getItem('customRules')) || []);
  const [newRuleCondition, setNewRuleCondition] = useState('');
  const [newRuleSeverity, setNewRuleSeverity] = useState('Critical');

  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

  const handleSortRules = () => {
    let _customRules = [...customRules];
    const draggedItemContent = _customRules.splice(dragItem.current, 1)[0];
    _customRules.splice(dragOverItem.current, 0, draggedItemContent);
    dragItem.current = null;
    dragOverItem.current = null;
    setCustomRules(_customRules);
  };

  const notify = (type, message) => {
    const id = Date.now();
    const newNotif = { id, type, message, time: new Date().toLocaleTimeString() };
    setNotifications(prev => [newNotif, ...prev]);
    setToasts(prev => [newNotif, ...prev]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const handleOpenNotifications = () => {
    setIsNotifOpen(!isNotifOpen);
    if (isNotifOpen) setNotifications([]); 
  };

  const [scanState, setScanState] = useState({ isActive: false, type: null, progress: 0, elapsed: 0, estimatedTotal: 25, phase: '' });
  const scanTimerRef = useRef(null);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // --- PERSISTENT SESSION STATE ---
  const [githubFindings, setGithubFindings] = useState(() => JSON.parse(localStorage.getItem('githubFindings')) || []);
  const [webFindings, setWebFindings] = useState(() => JSON.parse(localStorage.getItem('webFindings')) || []);
  const [containerFindings, setContainerFindings] = useState(() => JSON.parse(localStorage.getItem('containerFindings')) || []);
  const [ignoredIds, setIgnoredIds] = useState(() => JSON.parse(localStorage.getItem('ignoredIds')) || []);

  const [githubToken, setGithubToken] = useState(() => sessionStorage.getItem('githubToken') || null);
  const [userRepos, setUserRepos] = useState(() => JSON.parse(sessionStorage.getItem('userRepos')) || []);
  
  const [severityFilter, setSeverityFilter] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const [repo, setRepo] = useState('');
  const [targetUrl, setTargetUrl] = useState('http://testphp.vulnweb.com');
  const [dastMode, setDastMode] = useState('time-limited'); 
  const [dastTimeLimit, setDastTimeLimit] = useState(15);   
  const [showDastConfig, setShowDastConfig] = useState(false);
  const [dastConfig, setDastConfig] = useState({
    concurrency: 10,
    smartThrottling: true,
    recursiveCrawl: false,
    customHeaders: ''
  });
  const [dockerImage, setDockerImage] = useState('python:3.9-slim');

  useEffect(() => { localStorage.setItem('githubFindings', JSON.stringify(githubFindings)); }, [githubFindings]);
  useEffect(() => { localStorage.setItem('webFindings', JSON.stringify(webFindings)); }, [webFindings]);
  useEffect(() => { localStorage.setItem('containerFindings', JSON.stringify(containerFindings)); }, [containerFindings]);
  useEffect(() => { localStorage.setItem('ignoredIds', JSON.stringify(ignoredIds)); }, [ignoredIds]);
  useEffect(() => { 
    if (githubToken) sessionStorage.setItem('githubToken', githubToken);
    else sessionStorage.removeItem('githubToken');
  }, [githubToken]);
  useEffect(() => { sessionStorage.setItem('userRepos', JSON.stringify(userRepos)); }, [userRepos]);
  useEffect(() => { localStorage.setItem('customRules', JSON.stringify(customRules)); }, [customRules]);

  const [aiTriageData, setAiTriageData] = useState(() => JSON.parse(localStorage.getItem('aiTriageData')) || {});
  useEffect(() => { localStorage.setItem('aiTriageData', JSON.stringify(aiTriageData)); }, [aiTriageData]);
  const [isAiTriaging, setIsAiTriaging] = useState(false);

  const runAiTriage = async (currentFindings) => {
    if (currentFindings.length === 0) return notify('info', 'No findings to triage.');
    setIsAiTriaging(true);
    notify('info', 'Consulting Neural Network for Threat Triage...');
    
    try {
      const response = await axios.post('http://localhost:5000/api/ai/triage', { findings: currentFindings });
      setAiTriageData(prev => ({ ...prev, ...response.data.triage_results }));
      notify('success', 'Neural Triage complete. Dashboard updated.');
    } catch (error) {
      notify('error', 'AI Triage failed. Check neural link.');
    }
    setIsAiTriaging(false);
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code && !githubToken) {
      notify('info', 'Authenticating with GitHub...');
      axios.post('http://localhost:5000/api/auth/github', { code })
        .then(res => {
          if (res.data.status === 'success') {
            setGithubToken(res.data.token);
            setUserRepos(res.data.repos);
            if (res.data.repos.length > 0) setRepo(res.data.repos[0]);
            notify('success', 'GitHub Authentication Successful!');
          }
          window.history.replaceState({}, document.title, "/"); 
          setActiveTab('Source Audit'); 
        })
        .catch(err => notify('error', 'GitHub Authentication Failed.'));
    }
  }, [githubToken]);

  const applyRulesToFindings = (rawFindings) => {
    return rawFindings.map(finding => {
      let modifiedFinding = { ...finding }; 
      for (const rule of customRules) {
        const targetField = (modifiedFinding[rule.conditionField] || "").toLowerCase();
        const matchString = (rule.conditionMatch || "").toLowerCase();
        if (targetField.includes(matchString)) {
          modifiedFinding.originalSeverity = modifiedFinding.Severity; 
          modifiedFinding.Severity = rule.newSeverity;
          modifiedFinding.appliedRuleName = rule.name;
          break; 
        }
      }
      if (!modifiedFinding.appliedRuleName && aiTriageData[modifiedFinding.Issue]) {
        const aiAssessment = aiTriageData[modifiedFinding.Issue];
        if (aiAssessment.severity !== modifiedFinding.Severity) {
          modifiedFinding.originalSeverity = modifiedFinding.Severity;
          modifiedFinding.Severity = aiAssessment.severity;
          modifiedFinding.aiTriageReason = aiAssessment.reason;
        }
      }
      return modifiedFinding;
    });
  };

  const processedGithub = applyRulesToFindings(githubFindings);
  const processedWeb = applyRulesToFindings(webFindings);
  const processedContainer = applyRulesToFindings(containerFindings);

  const getActiveFindings = (findingsList) => findingsList.filter(f => !ignoredIds.includes(f.Issue) && (severityFilter.length === 0 || severityFilter.includes(f.Severity)));
  
  const activeGithub = getActiveFindings(processedGithub);
  const activeWeb = getActiveFindings(processedWeb);
  const activeContainer = getActiveFindings(processedContainer);
  const totalIssues = activeGithub.length + activeWeb.length + activeContainer.length;
  const allActiveFindings = [...activeGithub, ...activeWeb, ...activeContainer];

  // ==========================================
  // ⚖️ GRC COMPLIANCE ENGINE
  // ==========================================
  const calculateComplianceHealth = (findings) => {
    let scores = { 'SOC 2 (Trust)': 100, 'ISO 27001': 100, 'HIPAA (Privacy)': 100, 'OWASP Top 10': 100, 'PCI-DSS (Payments)': 100 };
    
    let criticalBlockers = 0;

    findings.forEach(f => {
      let deduction = f.Severity === 'Critical' ? 20 : f.Severity === 'High' ? 12 : f.Severity === 'Medium' ? 5 : 1;
      if (f.Severity === 'Critical' || f.Severity === 'High') criticalBlockers++;

      const issueStr = (f.Issue + " " + f.Type).toLowerCase();

      // Matrix Mapping
      if (issueStr.includes('secret') || issueStr.includes('token') || issueStr.includes('key')) {
        scores['SOC 2 (Trust)'] -= deduction;
        scores['HIPAA (Privacy)'] -= (deduction * 1.5);
        scores['PCI-DSS (Payments)'] -= deduction;
        scores['ISO 27001'] -= deduction;
      }
      if (issueStr.includes('injection') || issueStr.includes('sql') || issueStr.includes('xss') || issueStr.includes('rce')) {
        scores['OWASP Top 10'] -= deduction;
        scores['PCI-DSS (Payments)'] -= deduction;
        scores['SOC 2 (Trust)'] -= deduction;
      }
      if (issueStr.includes('config') || issueStr.includes('debug') || issueStr.includes('cve')) {
        scores['ISO 27001'] -= deduction;
        scores['SOC 2 (Trust)'] -= deduction;
        scores['OWASP Top 10'] -= (deduction * 0.5);
      }
      if (issueStr.includes('crypto') || issueStr.includes('hash') || issueStr.includes('md5')) {
        scores['HIPAA (Privacy)'] -= deduction;
        scores['PCI-DSS (Payments)'] -= (deduction * 1.5);
      }
    });

    const radarData = Object.keys(scores).map(key => ({
      subject: key,
      A: Math.max(0, scores[key]),
      fullMark: 100
    }));

    const averageScore = Math.round(radarData.reduce((acc, curr) => acc + curr.A, 0) / radarData.length);

    return { radarData, averageScore, criticalBlockers };
  };

  const { radarData, averageScore, criticalBlockers } = calculateComplianceHealth(allActiveFindings);

  // --- ENGINEERING DEBT CALCULATION ---
  const calculateEngineeringDebt = (findings) => {
    return findings.reduce((total, f) => {
      if (f.Severity === 'Critical') return total + 8;
      if (f.Severity === 'High') return total + 4;
      if (f.Severity === 'Medium') return total + 2;
      return total + 1; // Low severity
    }, 0);
  };
  const totalEngineeringHours = calculateEngineeringDebt(allActiveFindings);

  const getSeverityData = (findings) => {
    const counts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    findings.forEach(f => {
      const sev = f.Severity === 'HIGH' ? 'High' : f.Severity === 'MEDIUM' ? 'Medium' : f.Severity === 'LOW' ? 'Low' : f.Severity;
      if (counts[sev] !== undefined) counts[sev]++; else counts['Low']++; 
    });
    return [
      { name: 'Critical', value: counts.Critical, color: '#f43f5e' }, 
      { name: 'High', value: counts.High, color: '#f97316' },     
      { name: 'Medium', value: counts.Medium, color: '#eab308' }, 
      { name: 'Low', value: counts.Low, color: '#3b82f6' },        
    ];
  };

  const githubChartData = getSeverityData(activeGithub);
  const webChartData = getSeverityData(activeWeb);
  const containerChartData = getSeverityData(activeContainer);

  const handleResetEngine = () => {
    setGithubFindings([]); setWebFindings([]); setContainerFindings([]); setIgnoredIds([]);
    setAiTriageData({}); 
    setChatHistories({}); 
    setPocData({});
    localStorage.clear();
    notify('info', 'NexusSec Engine has been reset.');
  };

  const handleGithubLogout = () => {
    setGithubToken(null); setUserRepos([]); setRepo('');
    sessionStorage.removeItem('githubToken'); sessionStorage.removeItem('userRepos');
    notify('info', 'Disconnected from GitHub.');
  };

  const handleAddRule = () => {
    if (!newRuleCondition.trim()) return notify('error', 'Target condition cannot be empty.');
    const newRule = { id: 'rule_' + Date.now(), name: `Force '${newRuleCondition}' to ${newRuleSeverity}`, conditionField: 'Issue', conditionMatch: newRuleCondition.toLowerCase(), newSeverity: newRuleSeverity };
    setCustomRules([newRule, ...customRules]);
    setNewRuleCondition('');
    notify('success', 'Threat prioritization rule deployed.');
  };

  const handleDeleteRule = (id) => {
    setCustomRules(customRules.filter(r => r.id !== id));
    notify('info', 'Rule terminated.');
  };

  const downloadReport = (type) => {
    let data = [];
    let title = "";
    if (type === 'all') { data = [...activeGithub, ...activeWeb, ...activeContainer]; title = "Executive_Summary"; }
    if (type === 'sast') { data = activeGithub; title = "SAST_Code_Report"; }
    if (type === 'dast') { data = activeWeb; title = "DAST_Web_Report"; }
    if (type === 'container') { data = activeContainer; title = "Container_Security_Report"; }

    if (data.length === 0) { notify('error', `Cannot export. No findings available for ${title.replace(/_/g, ' ')}.`); return; }

    const reportDate = new Date().toLocaleString();
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>NexusSec - ${title}</title>
        <style>
          body { font-family: 'Segoe UI', system-ui, sans-serif; background: #09090b; color: #f4f4f5; padding: 40px; margin: 0; }
          .container { max-width: 1000px; margin: 0 auto; background: #18181b; padding: 40px; border-radius: 12px; border: 1px solid #27272a; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
          h1 { color: #818cf8; border-bottom: 2px solid #27272a; padding-bottom: 15px; margin-top: 0; }
          .stats { display: flex; gap: 20px; margin: 20px 0; padding: 20px; background: #09090b; border-radius: 8px; border: 1px solid #27272a; }
          .stat-box { flex: 1; }
          .stat-label { font-size: 12px; color: #a1a1aa; text-transform: uppercase; letter-spacing: 1px; }
          .stat-value { font-size: 28px; font-weight: bold; margin-top: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 30px; }
          th, td { border-bottom: 1px solid #27272a; padding: 16px 12px; text-align: left; }
          th { background: #09090b; color: #a1a1aa; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
          tr:hover { background: #27272a; }
          .badge { padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; text-transform: uppercase; border: 1px solid transparent; }
          .Critical, .High { background: rgba(244, 63, 94, 0.1); color: #f43f5e; border-color: rgba(244, 63, 94, 0.2); }
          .Medium { background: rgba(245, 158, 11, 0.1); color: #f59e0b; border-color: rgba(245, 158, 11, 0.2); }
          .Low, .Unknown, .Informational { background: rgba(59, 130, 246, 0.1); color: #3b82f6; border-color: rgba(59, 130, 246, 0.2); }
          .code { font-family: monospace; background: #09090b; padding: 4px 8px; border-radius: 4px; border: 1px solid #27272a; font-size: 12px; color: #a1a1aa; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🛡️ NexusSec Security Audit</h1>
          <div class="stats">
            <div class="stat-box"><div class="stat-label">Report Type</div><div class="stat-value" style="color: #e4e4e7;">${title.replace(/_/g, ' ')}</div></div>
            <div class="stat-box"><div class="stat-label">Generated On</div><div class="stat-value" style="font-size: 18px; margin-top: 12px; color: #a1a1aa;">${reportDate}</div></div>
            <div class="stat-box"><div class="stat-label">Total Findings</div><div class="stat-value" style="color: #f43f5e;">${data.length}</div></div>
          </div>
          <table>
            <tr><th>Severity</th><th>Category</th><th>Vulnerability Details</th><th>Location / Fix</th></tr>
            ${data.map(f => `<tr>
              <td><span class="badge ${f.Severity}">${f.Severity}</span></td>
              <td style="color: #a1a1aa; font-size: 14px;">${f.Type || 'Vulnerability'}</td>
              <td style="color: #f4f4f5; font-weight: 500;">${f.Issue}</td>
              <td><span class="code">${f.Fix}</span></td>
            </tr>`).join('')}
          </table>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NexusSec_${title}_${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setIsExportHovered(false); 
    notify('success', `${title.replace(/_/g, ' ')} downloaded successfully.`);
  };

  const runScan = async (type, endpoint, payload) => {
    if (scanState.isActive) return; 
    setLoading(true); setCurrentPage(1); 
    notify('info', `Initializing ${type.toUpperCase()} deep scan...`);
    
    const estTime = type === 'web' ? 45 : 25; 
    setScanState({ isActive: true, type, progress: 0, elapsed: 0, estimatedTotal: estTime, phase: 'Warming up engine...' });

    scanTimerRef.current = setInterval(() => {
      setScanState(prev => {
        const newElapsed = prev.elapsed + 1;
        const newProgress = Math.min(95, Math.floor((newElapsed / prev.estimatedTotal) * 100));
        let phase = prev.phase;
        if (newProgress > 10) phase = type === 'github' ? 'Cloning repository...' : type === 'web' ? 'Resolving target host...' : 'Pulling container layer...';
        if (newProgress > 40) phase = type === 'github' ? 'Extracting AST & Secrets...' : type === 'web' ? 'Spidering endpoints...' : 'Scanning CVE databases...';
        if (newProgress > 70) phase = 'Analyzing heuristics...';
        if (newProgress > 85) phase = 'Compiling security report...';
        return { ...prev, elapsed: newElapsed, progress: newProgress, phase };
      });
    }, 1000);

    try {
      const response = await axios.post(`http://localhost:5000/api/scan/${endpoint}`, payload);
      clearInterval(scanTimerRef.current);
      setScanState(prev => ({ ...prev, progress: 100, phase: 'Generating report...' }));
      
      setTimeout(() => {
        setScanState({ isActive: false, type: null, progress: 0, elapsed: 0, estimatedTotal: 0, phase: '' });
        setLoading(false);
        if (type === 'github') setGithubFindings(response.data.findings);
        if (type === 'web') setWebFindings(response.data.findings);
        if (type === 'container') setContainerFindings(response.data.findings);
        notify('success', `${type.toUpperCase()} scan completed. Found ${response.data.findings.length} issues.`);
      }, 800);
    } catch (error) {
      clearInterval(scanTimerRef.current);
      setScanState({ isActive: false, type: null, progress: 0, elapsed: 0, estimatedTotal: 0, phase: '' });
      setLoading(false);
      notify('error', `Scan failed: ${error.message}`);
    }
  };

  const formatAiResponse = (text) => {
    if (!text) return "";
    const codeBlocks = [];
    let formattedText = text.replace(/```([\s\S]*?)```/g, (match, code) => {
      codeBlocks.push(code);
      return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
    });

    formattedText = formattedText
      .replace(/### (.*)/g, '<h3 class="text-lg font-bold text-indigo-400 mt-6 mb-3 border-b border-zinc-800/80 pb-2 flex items-center gap-2">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-zinc-100">$1</strong>')
      .replace(/`([^`]+)`/g, '<code class="text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded font-mono text-xs border border-indigo-500/20">$1</code>')
      .replace(/^- (.*)/gm, '<li class="ml-4 list-disc marker:text-indigo-500 mb-1">$1</li>')
      .replace(/\n/g, '<br/>');

    formattedText = formattedText.replace(/__CODE_BLOCK_(\d+)__/g, (match, index) => {
      const safeCode = codeBlocks[index].replace(/</g, "&lt;").replace(/>/g, "&gt;");
      return `
        <div class="relative group mt-5 mb-5">
          <div class="absolute -top-3 left-4 bg-zinc-800 text-zinc-400 text-[10px] px-2 py-0.5 rounded border border-zinc-700 font-mono tracking-wider z-10">CODE SNIPPET</div>
          <pre class="bg-[#050505] p-5 pt-7 rounded-lg border border-zinc-800 overflow-x-auto text-zinc-300 font-mono text-sm shadow-inner leading-relaxed"><code>${safeCode}</code></pre>
        </div>
      `;
    });
    return formattedText;
  };

  const getAiFix = async (finding) => {
    setAiModalTab('chat'); 
    
    if (chatHistories[finding.Issue]) {
      setAiModal({ ...finding, messages: chatHistories[finding.Issue] });
      return; 
    }

    setAiLoading(true);
    setAiModal({ ...finding, messages: [{ role: 'assistant', content: "Initializing NexusSec Neural Core...\nAnalyzing vulnerability footprint..." }] });
    notify('info', 'Connecting to Neural Network...');
    
    try {
      const response = await axios.post('http://localhost:5000/api/ai/remediate', { finding });
      const newMessages = [{ role: 'assistant', content: response.data.remediation }];
      
      setAiModal(prev => ({ ...prev, messages: newMessages }));
      setChatHistories(prev => ({ ...prev, [finding.Issue]: newMessages }));
      notify('success', 'Neural Link established.');
    } catch (error) {
      setAiModal(prev => ({ ...prev, messages: [{ role: 'assistant', content: "Error: Could not connect to the AI service." }] }));
      notify('error', 'Neural Network connection failed.');
    }
    setAiLoading(false);
  };

  const handleChatSend = async () => {
    if (!chatInput.trim() || !aiModal) return;
    
    const userMsg = { role: 'user', content: chatInput };
    const updatedMessages = [...aiModal.messages, userMsg];
    
    setAiModal(prev => ({ ...prev, messages: updatedMessages }));
    setChatHistories(prev => ({ ...prev, [aiModal.Issue]: updatedMessages }));
    
    setChatInput('');
    setAiLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/ai/chat', { 
        finding: aiModal, 
        history: updatedMessages.map(m => ({ role: m.role, content: m.content })) 
      });
      
      const finalMessages = [...updatedMessages, { role: 'assistant', content: response.data.reply }];
      setAiModal(prev => ({ ...prev, messages: finalMessages }));
      setChatHistories(prev => ({ ...prev, [aiModal.Issue]: finalMessages }));
      
    } catch (error) {
      notify('error', 'Chat transmission failed.');
    }
    setAiLoading(false);
  };

  const handleClearChat = (issueName) => {
    const updatedHistories = { ...chatHistories };
    delete updatedHistories[issueName];
    setChatHistories(updatedHistories);
    
    const updatedPoc = { ...pocData };
    delete updatedPoc[issueName];
    setPocData(updatedPoc);
    
    setAiModal(null);
    notify('info', 'Chat & Exploit history discarded.');
  };

  const generatePoC = async (finding) => {
    if (pocData[finding.Issue]) return; 
    
    setPocLoading(true);
    notify('info', 'Initializing Offensive Red Team module...');
    
    try {
      const response = await axios.post('http://localhost:5000/api/ai/exploit', { finding });
      setPocData(prev => ({ ...prev, [finding.Issue]: response.data.poc }));
      notify('success', 'Exploit payload synthesized.');
    } catch (error) {
      setPocData(prev => ({ ...prev, [finding.Issue]: "Error: Failed to synthesize exploit payload. Verify AI connection." }));
      notify('error', 'Red Team module connection failed.');
    }
    setPocLoading(false);
  };

  useEffect(() => {
    if (messagesEndRef.current && aiModalTab === 'chat') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [aiModal?.messages, aiModalTab]);

  const renderSidebarItem = (name, Icon) => (
    <button
      onClick={() => { setActiveTab(name); setCurrentPage(1); setSeverityFilter([]); }}
      className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-4' : 'justify-center px-0'} py-2.5 rounded-md transition-all duration-200 text-sm font-medium relative z-30 ${
        activeTab === name ? 'bg-indigo-500/10 text-indigo-400 shadow-sm ring-1 ring-indigo-500/30' : 'text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-100'
      }`}
      title={!isSidebarOpen ? name : ""}
    >
      <Icon size={isSidebarOpen ? 18 : 22} className={activeTab === name ? 'text-indigo-400 flex-shrink-0' : 'text-zinc-500 flex-shrink-0'} /> 
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.span 
            initial={{ opacity: 0, width: 0 }} 
            animate={{ opacity: 1, width: "auto" }} 
            exit={{ opacity: 0, width: 0 }}
            className="whitespace-nowrap overflow-hidden"
          >
            {name}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );

  const renderProgressBar = (scanType) => {
    if (!scanState.isActive || scanState.type !== scanType) return null;
    const remaining = Math.max(0, scanState.estimatedTotal - scanState.elapsed);
    return (
      <div className="w-full bg-zinc-900 border border-indigo-500/30 rounded-lg p-4 mt-4 relative overflow-hidden shadow-lg z-20">
        <div className="absolute top-0 left-0 h-1 bg-indigo-500 transition-all duration-500 ease-out" style={{ width: `${scanState.progress}%` }} />
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-bold text-indigo-400 flex items-center gap-2"><Activity size={14} className="animate-spin" /> {scanState.phase}</span>
          <span className="text-xs font-mono text-zinc-400">{scanState.progress}%</span>
        </div>
        <div className="flex justify-between items-center text-xs text-zinc-500 font-mono mt-2">
          <span className="flex items-center gap-1"><Clock size={12}/> Elapsed: {formatTime(scanState.elapsed)}</span>
          <span className="flex items-center gap-1">Remaining: ~{formatTime(remaining)}</span>
        </div>
      </div>
    );
  };

  const getSeverityStyles = (severity) => {
    const sev = severity?.toUpperCase() || '';
    if (sev === 'CRITICAL' || sev === 'HIGH') return 'border-l-rose-500 bg-rose-500/10 text-rose-400 border-rose-500/20';
    if (sev === 'MEDIUM') return 'border-l-amber-500 bg-amber-500/10 text-amber-400 border-amber-500/20';
    return 'border-l-blue-500 bg-blue-500/10 text-blue-400 border-blue-500/20';
  };

  const renderFindingsList = (processedFindings) => {
    const totalPages = Math.ceil(processedFindings.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedItems = processedFindings.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    return (
      <div className="space-y-4 mt-6 relative z-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-zinc-500 mr-2" />
            {['Critical', 'High', 'Medium', 'Low'].map(sev => (
              <button key={sev} onClick={() => { setCurrentPage(1); setSeverityFilter(prev => prev.includes(sev) ? prev.filter(s => s !== sev) : [...prev, sev]); }} 
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all border ${severityFilter.includes(sev) ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : 'bg-zinc-900/80 backdrop-blur-sm text-zinc-400 border-zinc-800 hover:border-zinc-700'}`}>
                {sev}
              </button>
            ))}
          </div>

          <button 
            onClick={() => runAiTriage(processedFindings)}
            disabled={isAiTriaging || processedFindings.length === 0}
            className="flex items-center gap-2 bg-fuchsia-600/10 hover:bg-fuchsia-600/20 border border-fuchsia-500/30 text-fuchsia-400 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(217,70,239,0.15)] disabled:opacity-50"
          >
            {isAiTriaging ? <Activity size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {isAiTriaging ? 'Analyzing...' : 'Auto-Triage List'}
          </button>
        </div>

        {processedFindings.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/40 backdrop-blur-sm mt-2 relative z-20">
            <ShieldAlert size={40} className="text-zinc-700 mb-3" />
            <p className="text-zinc-500 text-sm font-medium">No vulnerabilities match the current criteria.</p>
          </div>
        ) : (
          <>
            {paginatedItems.map((f, idx) => {
              const hasChatHistory = !!chatHistories[f.Issue];

              return (
                <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className="group relative bg-zinc-900/60 backdrop-blur-md hover:bg-zinc-800/80 p-5 rounded-lg border border-zinc-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 transition-colors overflow-hidden">
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${f.Severity === 'Critical' || f.Severity === 'High' ? 'bg-rose-500' : f.Severity === 'Medium' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                  <div className="flex flex-col gap-2 flex-1 pl-2">
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-sm border flex items-center gap-1.5 w-max ${getSeverityStyles(f.Severity)}`}>{f.Severity || 'UNKNOWN'}</span>
                      <span className="text-zinc-500 text-xs font-mono">{f.Type || 'Vulnerability'}</span>
                    </div>
                    <h4 className="text-base font-semibold text-zinc-100 font-mono tracking-tight">{f.Issue}</h4>
                    
                    {f.appliedRuleName && (
                      <div className="flex items-center gap-2 mt-1.5 mb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/30 px-2 py-1 rounded flex items-center gap-1.5 w-max shadow-[0_0_10px_rgba(99,102,241,0.1)]">
                          <ShieldAlert size={12} /> Override: {f.appliedRuleName}
                        </span>
                        <span className="text-[10px] text-zinc-600 font-mono uppercase font-bold">(Raw: {f.originalSeverity})</span>
                      </div>
                    )}

                    {f.aiTriageReason && (
                      <div className="flex flex-col md:flex-row md:items-center gap-2 mt-2 mb-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-fuchsia-400 bg-fuchsia-500/10 border border-fuchsia-500/30 px-2 py-1 rounded flex items-center gap-1.5 w-max shadow-[0_0_10px_rgba(217,70,239,0.15)]">
                          <Sparkles size={12} /> AI Elevated
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono italic border-l border-zinc-700 pl-2">
                          "{f.aiTriageReason}" <span className="text-zinc-600 font-bold ml-1">(Raw: {f.originalSeverity})</span>
                        </span>
                      </div>
                    )}
                    
                    <code className="text-[10px] text-zinc-400 bg-zinc-950 px-2 py-1 rounded border border-zinc-800 w-max font-mono uppercase tracking-widest">
                      {f.Fix}
                    </code>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 w-full md:w-auto">
                    {hasChatHistory ? (
                      <button onClick={() => getAiFix(f)} className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-md text-sm font-semibold transition-all shadow-[0_0_10px_rgba(99,102,241,0.4)]">
                        <TerminalSquare size={14} /> Resume Chat
                      </button>
                    ) : (
                      <button onClick={() => getAiFix(f)} className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 bg-white hover:bg-zinc-200 text-black px-4 py-2 rounded-md text-sm font-semibold transition-all">
                        <Sparkles size={14} /> Auto-Fix
                      </button>
                    )}
                    <button onClick={() => { setIgnoredIds([...ignoredIds, f.Issue]); notify('info', 'Issue dismissed.'); }} className="p-2 text-zinc-500 hover:bg-rose-500/10 hover:text-rose-400 rounded-md transition-colors" title="Dismiss"><Trash2 size={16} /></button>
                  </div>
                </motion.div>
              );
            })}

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 p-2 bg-zinc-900/60 backdrop-blur-md rounded-md border border-zinc-800">
                <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-zinc-400 hover:text-zinc-100 disabled:opacity-30 rounded-md hover:bg-zinc-800"><ChevronLeft size={16}/> Prev</button>
                <span className="text-xs font-medium text-zinc-500">Page {currentPage} of {totalPages}</span>
                <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-zinc-400 hover:text-zinc-100 disabled:opacity-30 rounded-md hover:bg-zinc-800">Next <ChevronRight size={16}/></button>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const renderChart = (title, icon, data) => {
    const hasData = data.some(d => d.value > 0);
    return (
      <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800 rounded-xl p-5 flex flex-col h-64 shadow-sm relative z-20">
        <h3 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">{icon} {title}</h3>
        {hasData ? (
          <ResponsiveContainer key={`chart-${isSidebarOpen}`} width="100%" height="100%">
            <BarChart data={data} margin={{ top: 0, right: 0, left: -25, bottom: 0 }} barSize={30}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="name" stroke="#52525b" axisLine={false} tickLine={false} tick={{fontSize: 10}} dy={5} />
              <YAxis stroke="#52525b" axisLine={false} tickLine={false} tick={{fontSize: 10}} allowDecimals={false} />
              <Tooltip cursor={{fill: '#27272a', opacity: 0.4}} contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px', fontSize: '12px', border: '1px solid #27272a' }} itemStyle={{ color: '#e4e4e7' }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-600">
            <Activity size={24} className="mb-2 opacity-20" />
            <span className="text-xs font-medium">Awaiting Telemetry</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-[#09090b] text-zinc-200 font-sans selection:bg-indigo-500/30 relative">
      
      <MatrixBackground />
      
      {/* --- SIDEBAR --- */}
      <motion.div 
        initial={false}
        animate={{ width: isSidebarOpen ? 256 : 80 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="bg-[#09090b]/80 backdrop-blur-xl border-r border-zinc-800/60 flex flex-col z-20 relative overflow-visible"
      >
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
          className="absolute -right-3 top-8 bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-white rounded-full p-1 z-50 transition-colors shadow-lg flex items-center justify-center"
        >
          {isSidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>

        <div className={`p-6 flex items-center ${isSidebarOpen ? 'gap-3' : 'justify-center'} transition-all`}>
          <div className="bg-white p-1.5 rounded-md min-w-[32px] flex justify-center">
            <ShieldAlert className="text-black" size={22} />
          </div>
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col whitespace-nowrap overflow-hidden">
                <span className="text-sm font-bold text-white tracking-wide">NexusSec</span>
                <span className="text-[10px] text-zinc-500 font-mono uppercase">Enterprise VAPT</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-x-hidden">
          {isSidebarOpen && <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-3 ml-2">Overview</p>}
          {renderSidebarItem('Dashboard', LayoutGrid)}
          
          {/* ✨ NEW GRC TAB ADDED HERE */}
          {renderSidebarItem('Compliance & GRC', Scale)}
          
          {isSidebarOpen && <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-3 mt-8 ml-2">Scanners</p>}
          {renderSidebarItem('Source Audit', FileCode2)}
          {renderSidebarItem('Penetration Test', Globe)}
          {renderSidebarItem('Container Security', Box)}
        </nav>

        <div className="p-4 mt-auto">
          {isSidebarOpen ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="whitespace-nowrap overflow-hidden">
              <div className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-lg flex items-center justify-between mb-2">
                <div>
                  <p className="text-[10px] text-zinc-500 font-semibold uppercase">Total Findings</p>
                  <p className="text-2xl font-bold text-white">{totalIssues}</p>
                </div>
                <Activity className="text-indigo-500/50" size={24}/>
              </div>
              <button onClick={handleResetEngine} className="w-full inline-flex items-center justify-center gap-2 text-xs font-semibold text-zinc-500 hover:text-rose-400 p-2 transition-colors">
                <Trash2 size={14}/> Reset Engine
              </button>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="bg-zinc-900/80 border border-zinc-800 p-2 rounded-lg flex flex-col items-center" title={`Total Findings: ${totalIssues}`}>
                <Activity className="text-indigo-500/50 mb-1" size={16}/>
                <span className="text-xs font-bold text-white">{totalIssues}</span>
              </div>
              <button onClick={handleResetEngine} className="text-zinc-500 hover:text-rose-400 p-2 transition-colors" title="Reset Engine">
                <Trash2 size={18}/>
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        <header className="h-16 border-b border-zinc-800/60 bg-[#09090b]/60 backdrop-blur-xl flex items-center justify-between px-8 sticky top-0 z-30">
          <div className="flex items-center gap-2 text-sm text-zinc-400"><span>NexusSec</span> <ChevronRight size={14} className="text-zinc-600"/> <span className="text-zinc-100 font-medium">{activeTab}</span></div>
          
          <div className="flex items-center gap-4">
            <button onClick={() => setIsRuleEngineOpen(true)} className="relative text-zinc-400 hover:text-indigo-400 transition-colors p-2 rounded-md hover:bg-zinc-800" title="Threat Prioritization Engine">
              <Sliders size={18} />
            </button>

            <div className="relative">  
              <button onClick={handleOpenNotifications} className="relative text-zinc-400 hover:text-white transition-colors p-2 rounded-md hover:bg-zinc-800">
                <Bell size={18}/>
                {notifications.length > 0 && <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-rose-500 border-2 border-[#09090b] rounded-full animate-pulse" />}
              </button>
              <AnimatePresence>
                {isNotifOpen && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute right-0 mt-2 w-80 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden">
                    <div className="p-4 border-b border-zinc-800 bg-zinc-950 flex justify-between items-center"><span className="text-sm font-semibold text-white">System Events</span><span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">{notifications.length} New</span></div>
                    <div className="max-h-64 overflow-y-auto p-2">
                      {notifications.length === 0 ? <p className="text-xs text-zinc-500 text-center py-6">No new notifications</p> : notifications.map(n => (
                        <div key={n.id} className="p-3 mb-1 bg-zinc-800/50 rounded-lg flex gap-3 items-start">
                          {n.type === 'success' ? <CheckCircle size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" /> : n.type === 'error' ? <XCircle size={16} className="text-rose-500 mt-0.5 flex-shrink-0" /> : <Info size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />}
                          <div><p className="text-xs text-zinc-200 leading-snug">{n.message}</p><p className="text-[10px] text-zinc-500 mt-1">{n.time}</p></div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="h-4 w-px bg-zinc-800"></div>
            <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold text-white border border-indigo-400">MV</div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 relative z-20">
          <div className="max-w-6xl mx-auto">
            <AnimatePresence mode="wait">
              {/* DASHBOARD PAGE */}
              {activeTab === 'Dashboard' && (
                <motion.div key="dash" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 relative z-30">
                    <div><h2 className="text-2xl font-bold text-white tracking-tight">Security Posture</h2><p className="text-sm text-zinc-500 mt-1">Real-time vulnerability analytics across your infrastructure.</p></div>
                    
                    <div className="relative" onMouseEnter={() => setIsExportHovered(true)} onMouseLeave={() => setIsExportHovered(false)}>
                      <button className="inline-flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700 px-4 py-2 rounded-md text-sm font-medium transition-all shadow-lg">
                        <Download size={16} /> Export Report
                      </button>
                      <AnimatePresence>
                        {isExportHovered && (
                          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} className="absolute right-0 mt-1 w-56 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl z-50 overflow-hidden pt-1 pb-1">
                            <button onClick={() => downloadReport('all')} className="w-full px-4 py-2.5 text-sm text-zinc-300 hover:bg-indigo-500/20 hover:text-indigo-300 text-left flex items-center gap-3 transition-colors"><FileText size={14}/> Executive Summary</button>
                            <button onClick={() => downloadReport('sast')} className="w-full px-4 py-2.5 text-sm text-zinc-300 hover:bg-indigo-500/20 hover:text-indigo-300 text-left flex items-center gap-3 transition-colors"><Code2 size={14}/> SAST Code Report</button>
                            <button onClick={() => downloadReport('dast')} className="w-full px-4 py-2.5 text-sm text-zinc-300 hover:bg-indigo-500/20 hover:text-indigo-300 text-left flex items-center gap-3 transition-colors"><Globe size={14}/> DAST Web Report</button>
                            <button onClick={() => downloadReport('container')} className="w-full px-4 py-2.5 text-sm text-zinc-300 hover:bg-indigo-500/20 hover:text-indigo-300 text-left flex items-center gap-3 transition-colors"><Server size={14}/> Container Report</button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 relative z-20">
                    <div className="bg-gradient-to-br from-rose-500/10 to-zinc-900/60 backdrop-blur-md border border-rose-500/20 p-5 rounded-xl"><div className="flex items-center justify-between mb-4"><p className="text-xs font-semibold text-rose-500/70 uppercase">Total Threats</p><AlertTriangle size={16} className="text-rose-500/50"/></div><p className="text-3xl font-bold text-rose-100">{totalIssues}</p></div>
                    <div className="bg-gradient-to-br from-indigo-500/10 to-zinc-900/60 backdrop-blur-md border border-indigo-500/20 p-5 rounded-xl"><div className="flex items-center justify-between mb-4"><p className="text-xs font-semibold text-indigo-500/70 uppercase">Codebase</p><Code2 size={16} className="text-indigo-500/50"/></div><p className="text-3xl font-bold text-indigo-100">{activeGithub.length}</p></div>
                    <div className="bg-gradient-to-br from-violet-500/10 to-zinc-900/60 backdrop-blur-md border border-violet-500/20 p-5 rounded-xl"><div className="flex items-center justify-between mb-4"><p className="text-xs font-semibold text-violet-500/70 uppercase">Runtime Web</p><Globe size={16} className="text-violet-500/50"/></div><p className="text-3xl font-bold text-violet-100">{activeWeb.length}</p></div>
                    <div className="bg-gradient-to-br from-cyan-500/10 to-zinc-900/60 backdrop-blur-md border border-cyan-500/20 p-5 rounded-xl"><div className="flex items-center justify-between mb-4"><p className="text-xs font-semibold text-cyan-500/70 uppercase">Containers</p><Server size={16} className="text-cyan-500/50"/></div><p className="text-3xl font-bold text-cyan-100">{activeContainer.length}</p></div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {renderChart('SAST Code Distribution', <Code2 className="text-indigo-400" size={16}/>, githubChartData)}
                    {renderChart('DAST Web Vulnerabilities', <Globe className="text-violet-400" size={16}/>, webChartData)}
                    {renderChart('Container CVEs', <Server className="text-cyan-400" size={16}/>, containerChartData)}
                  </div>
                </motion.div>
              )}

              {/* ✨ NEW COMPLIANCE & GRC PAGE */}
              {activeTab === 'Compliance & GRC' && (
                <motion.div key="grc" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 relative z-30">
                    <div>
                      <h2 className="text-2xl font-bold text-white tracking-tight">Governance, Risk & Compliance</h2>
                      <p className="text-sm text-zinc-500 mt-1">Translating technical vulnerabilities into business risk and audit readiness.</p>
                    </div>
                  </div>

                  {/* Top KPI Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 relative z-20">
                    <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800 p-5 rounded-xl flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-1">Global Health Score</p>
                        <p className={`text-3xl font-bold ${averageScore > 80 ? 'text-emerald-400' : averageScore > 50 ? 'text-amber-400' : 'text-rose-400'}`}>{averageScore}<span className="text-lg text-zinc-600">/100</span></p>
                      </div>
                      <div className={`p-3 rounded-full ${averageScore > 80 ? 'bg-emerald-500/10 text-emerald-500' : averageScore > 50 ? 'bg-amber-500/10 text-amber-500' : 'bg-rose-500/10 text-rose-500'}`}>
                        <Scale size={24} />
                      </div>
                    </div>

                    <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800 p-5 rounded-xl flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-1">Audit Blockers</p>
                        <p className="text-3xl font-bold text-white">{criticalBlockers} <span className="text-sm font-medium text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded uppercase tracking-wider">Critical</span></p>
                      </div>
                      <div className="p-3 rounded-full bg-indigo-500/10 text-indigo-400">
                        <ShieldCheck size={24} />
                      </div>
                    </div>

                    {/* ✨ REPLACED: Engineering Hours (AI ROI Metric) */}
                    <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800 p-5 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Manual Remediation Time</p>
                        </div>
                        <p className="text-3xl font-bold text-indigo-100">
                          {totalEngineeringHours} <span className="text-lg text-zinc-500 font-medium">hrs</span>
                        </p>
                      </div>
                      <div className="p-3 rounded-full bg-indigo-500/10 text-indigo-400">
                        <Clock size={24} />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-20">
                    
                    {/* The Radar Chart */}
                    <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800 rounded-xl p-6 flex flex-col items-center">
                      <h3 className="text-sm font-semibold text-zinc-300 w-full text-left mb-2 flex items-center gap-2">
                        <Activity size={16} className="text-indigo-400" /> Compliance Framework Mapping
                      </h3>
                      <div className="w-full h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                            <PolarGrid stroke="#27272a" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#a1a1aa', fontSize: 11, fontWeight: 'bold' }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} />
                            <Radar name="Compliance Score" dataKey="A" stroke="#818cf8" fill="#6366f1" fillOpacity={0.3} />
                            <Tooltip cursor={{fill: '#27272a', opacity: 0.4}} contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px', fontSize: '12px', border: '1px solid #27272a' }} itemStyle={{ color: '#818cf8', fontWeight: 'bold' }} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-2 text-center max-w-sm">
                        Calculated by correlating active technical threats with specific regulatory control requirements.
                      </p>
                    </div>

                    {/* ✨ UPDATED: Dynamic Threat / Business Translation List */}
                    <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800 rounded-xl p-6 flex flex-col h-[420px]">
                      <h3 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
                        <AlertTriangle size={16} className="text-rose-400" /> Key Executive Risks
                      </h3>
                      <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                        {allActiveFindings.length === 0 ? (
                          <div className="h-full flex items-center justify-center text-zinc-600 text-sm">
                            No active threats found. Systems are compliant.
                          </div>
                        ) : (
                          allActiveFindings.slice(0, 8).map((finding, idx) => {
                            const issueLower = (finding.Issue + " " + finding.Type).toLowerCase();
                            
                            // 1. Dynamic Framework Assignment
                            let framework = "OWASP Top 10";
                            let frameworkColor = "text-blue-400 bg-blue-500/10 border-blue-500/20";
                            
                            if (issueLower.includes('secret') || issueLower.includes('token') || issueLower.includes('api')) {
                              framework = "SOC 2 (CC6.1)";
                              frameworkColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
                            } else if (issueLower.includes('config') || issueLower.includes('cve') || issueLower.includes('debug')) {
                              framework = "ISO 27001 (A.12)";
                              frameworkColor = "text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20";
                            } else if (issueLower.includes('crypto') || issueLower.includes('hash')) {
                              framework = "PCI-DSS (Req 4)";
                              frameworkColor = "text-amber-400 bg-amber-500/10 border-amber-500/20";
                            }

                            // 2. Dynamic Description Generator
                            let riskDesc = "";
                            if (issueLower.includes('secret') || issueLower.includes('token') || issueLower.includes('api')) {
                              riskDesc = "Unencrypted credentials detected. Violates confidentiality and secure asset management controls.";
                            } else if (issueLower.includes('injection') || issueLower.includes('sql') || issueLower.includes('xss')) {
                              riskDesc = "Missing input sanitization allows unauthorized database or client access. Violates data integrity guidelines.";
                            } else if (issueLower.includes('crypto') || issueLower.includes('hash')) {
                              riskDesc = "Weak cryptographic protocols detected. Violates data-at-rest encryption requirements.";
                            } else {
                              // If it doesn't match the above, use the specific FIX provided by the LLM as the description
                              riskDesc = finding.Fix ? `Remediation required to pass audit: ${finding.Fix}` : "Fails baseline security and patch management compliance controls.";
                            }

                            return (
                              <div key={idx} className="p-3 bg-zinc-950/50 border border-zinc-800 rounded-lg flex flex-col gap-2">
                                <div className="flex justify-between items-start">
                                  <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${frameworkColor}`}>
                                    Violates: {framework}
                                  </span>
                                  <span className={`text-[10px] font-bold uppercase ${finding.Severity === 'Critical' ? 'text-rose-500' : finding.Severity === 'High' ? 'text-orange-500' : 'text-zinc-500'}`}>
                                    {finding.Severity}
                                  </span>
                                </div>
                                <p className="text-sm text-zinc-200 font-medium truncate" title={finding.Issue}>{finding.Issue}</p>
                                <p className="text-xs text-zinc-500 line-clamp-2">
                                  {riskDesc}
                                </p>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* SOURCE AUDIT PAGE */}
              {activeTab === 'Source Audit' && (
                <motion.div key="source" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <div className="mb-8 relative z-20"><h2 className="text-2xl font-bold text-white tracking-tight">Static Application Security Testing</h2><p className="text-sm text-zinc-500 mt-1">Scan source code repositories for secrets and vulnerabilities.</p></div>
                  {!githubToken ? (
                    <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800 border-dashed rounded-xl p-12 flex flex-col items-center justify-center text-center relative z-20">
                      <div className="bg-zinc-800 p-4 rounded-full mb-6"><Github size={32} className="text-white" /></div><h3 className="text-lg font-semibold text-white mb-2">Connect to GitHub</h3><p className="text-zinc-500 text-sm max-w-md mb-8">Authorize NexusSec to access your repositories for automated scanning.</p>
                      <a href={`https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=repo%20user&redirect_uri=http://localhost:3000`} className="inline-flex items-center justify-center gap-2 bg-white text-black hover:bg-zinc-200 px-6 py-2.5 rounded-md text-sm font-bold transition-all w-full max-w-xs mb-8"><Github size={18}/> Authenticate</a>
                      <div className="w-full max-w-xl border-t border-zinc-800 pt-8 flex flex-col gap-3">
                        <div className="flex gap-3">
                          <div className="relative flex-1"><Code2 className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16}/><input type="text" value={repo} onChange={(e) => setRepo(e.target.value)} placeholder="Or paste public repo URL..." className="w-full bg-[#09090b] border border-zinc-800 rounded-md py-2 pl-10 pr-4 text-sm text-zinc-200 outline-none transition-all" /></div>
                          <button onClick={() => runScan('github', 'github', { repo })} disabled={scanState.isActive} className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-md text-sm font-medium transition-all disabled:opacity-50">{scanState.isActive && scanState.type === 'github' ? <Activity size={16} className="animate-spin" /> : "Run Scan"}</button>
                        </div>
                        {renderProgressBar('github')}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800 rounded-xl p-6 flex flex-col gap-4 relative z-20">
                      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                        <div className="flex items-center gap-4"><div className="bg-indigo-500/20 p-2.5 rounded-lg"><Github className="text-indigo-400" size={20}/></div><div><p className="text-white text-sm font-semibold">GitHub Connected</p><p className="text-zinc-500 text-xs">{userRepos.length} Repositories sync'd</p></div></div>
                        <button onClick={handleGithubLogout} className="p-2 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors"><LogOut size={16}/></button>
                      </div>
                      <div className="flex flex-col gap-3">
                        <div className="flex gap-3">
                          <select value={repo} onChange={(e) => setRepo(e.target.value)} className="flex-1 bg-[#09090b] border border-zinc-800 rounded-md py-2 px-3 text-sm text-zinc-200 outline-none">{userRepos.map((r, i) => <option key={i} value={r}>{r}</option>)}</select>
                          <button onClick={() => runScan('github', 'github', { repo, token: githubToken })} disabled={scanState.isActive} className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap disabled:opacity-50">Run SAST</button>
                        </div>
                        {renderProgressBar('github')}
                      </div>
                    </div>
                  )}
                  {renderFindingsList(activeGithub)}
                </motion.div>
              )}

              {/* PENETRATION TEST PAGE */}
              {activeTab === 'Penetration Test' && (
                <motion.div key="web" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <div className="mb-6 relative z-20 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-white tracking-tight">Dynamic Application Security Testing</h2>
                      <p className="text-sm text-zinc-500 mt-1">Execute live reconnaissance and exploit simulation on active targets.</p>
                    </div>
                  </div>

                  {/* 🎛️ THE LIQUID TAB SWITCHER */}
                  <div className="flex gap-2 p-1.5 bg-[#09090b] border border-zinc-800 rounded-lg w-max mb-6 relative z-20 shadow-inner">
                    {['time-limited', 'full'].map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setDastMode(mode)}
                        className={`relative px-6 py-2 text-sm font-semibold rounded-md transition-colors z-10 ${dastMode === mode ? (mode === 'time-limited' ? 'text-cyan-400' : 'text-rose-400') : 'text-zinc-500 hover:text-zinc-300'}`}
                      >
                        {dastMode === mode && (
                          <motion.div
                            layoutId="dastModeActive"
                            className={`absolute inset-0 rounded-md -z-10 ${mode === 'time-limited' ? 'bg-cyan-500/10 border border-cyan-500/30' : 'bg-rose-500/10 border border-rose-500/30'}`}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                          />
                        )}
                        {mode === 'time-limited' ? 'Time-Boxed Scan' : 'Full Exhaustive DAST'}
                      </button>
                    ))}
                  </div>

                  <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800 rounded-xl p-6 relative z-20 overflow-hidden shadow-lg">
                    
                    <div className="relative mb-8">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18}/>
                      <input 
                        type="text" 
                        value={targetUrl} 
                        onChange={(e) => setTargetUrl(e.target.value)} 
                        className="w-full h-full bg-[#050505] border border-zinc-800 rounded-lg py-4 pl-12 pr-4 text-sm text-zinc-200 outline-none transition-all focus:border-indigo-500/50 shadow-inner" 
                        placeholder="https://target-application.com" 
                      />
                    </div>

                    <AnimatePresence mode="wait">
                      {dastMode === 'time-limited' ? (
                        <motion.div key="time-limited" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }} className="flex flex-col gap-6">
                          <div className="bg-[#09090b] border border-zinc-800/80 rounded-lg p-5">
                            <div className="flex items-center gap-2 mb-6">
                              <Clock size={16} className={dastTimeLimit === 5 ? 'text-cyan-400 transition-colors duration-500' : dastTimeLimit === 15 ? 'text-violet-400 transition-colors duration-500' : 'text-rose-400 transition-colors duration-500'}/>
                              <h4 className="text-sm font-bold text-zinc-200">Execution Time Limit</h4>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              {[
                                { time: 5, title: 'Surface Recon', desc: 'Fast checks for obvious misconfigurations. Ideal for rapid CI/CD pipeline feedback.', colorCode: '#22d3ee' },
                                { time: 15, title: 'Standard Audit', desc: 'Balanced endpoint spidering and vulnerability fuzzing. Best for daily security sanity checks.', colorCode: '#a78bfa' },
                                { time: 30, title: 'Deep Assessment', desc: 'Heavy payload injection & exhaustive parameter testing. Best for pre-production staging.', colorCode: '#fb7185' }
                              ].map((option) => {
                                const isActive = dastTimeLimit === option.time;

                                return (
                                  <button 
                                    key={option.time} 
                                    onClick={() => setDastTimeLimit(option.time)} 
                                    className="relative flex flex-col items-start p-5 rounded-xl text-left transition-all duration-500 group outline-none"
                                  >
                                    {isActive && (
                                      <motion.div 
                                        layoutId="activeBorderCrawling"
                                        className="absolute inset-0 rounded-xl z-10 pointer-events-none"
                                        initial={false}
                                        animate={{ borderColor: option.colorCode, boxShadow: `0 0 20px ${option.colorCode}33` }}
                                        transition={{ type: "spring", stiffness: 300, damping: 30, borderColor: { duration: 0.5 } }}
                                        style={{ borderWidth: '2px', borderStyle: 'solid' }}
                                      />
                                    )}

                                    <div className="mb-2 flex items-center justify-between w-full relative z-20">
                                      <span className={`text-3xl font-black transition-colors duration-500 ${isActive ? (option.time === 5 ? 'text-cyan-400' : option.time === 15 ? 'text-violet-400' : 'text-rose-400') : 'text-zinc-600'}`}>
                                        {option.time}
                                        <span className="text-xs font-semibold ml-1 opacity-70">MIN</span>
                                      </span>
                                      {isActive && (
                                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex-shrink-0">
                                          <Activity size={16} className={option.time === 5 ? 'text-cyan-400' : option.time === 15 ? 'text-violet-400' : 'text-rose-400'} />
                                        </motion.div>
                                      )}
                                    </div>

                                    <h5 className={`text-xs font-bold uppercase tracking-wider mb-1 relative z-20 transition-colors duration-500 ${isActive ? 'text-zinc-100' : 'text-zinc-500'}`}>{option.title}</h5>
                                    <p className={`text-[10px] leading-relaxed relative z-20 transition-colors duration-500 ${isActive ? 'text-zinc-400' : 'text-zinc-700'}`}>{option.desc}</p>
                                    <div className={`absolute inset-0 rounded-xl -z-10 transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-0'} ${option.time === 5 ? 'bg-cyan-500/5' : option.time === 15 ? 'bg-violet-500/5' : 'bg-rose-500/5'}`} />
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <button 
                            onClick={() => runScan('web', 'web', { target: targetUrl, timeLimit: dastTimeLimit, type: 'recon' })} 
                            disabled={scanState.isActive} 
                            className={`w-full inline-flex items-center justify-center gap-2 text-white px-4 py-4 rounded-lg text-sm font-black transition-all duration-700 disabled:opacity-50 shadow-lg relative overflow-hidden
                              ${dastTimeLimit === 5 ? 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-900/20' : 
                                dastTimeLimit === 15 ? 'bg-violet-600 hover:bg-violet-500 shadow-violet-900/20' : 
                                'bg-rose-600 hover:bg-rose-500 shadow-rose-900/20'}`}
                          >
                            <Zap size={18} className={scanState.isActive ? 'animate-spin' : 'animate-pulse'} /> 
                            INITIATE {dastTimeLimit}-MINUTE SCAN
                          </button>
                        </motion.div>

                      ) : (

                        <motion.div key="full" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="flex flex-col gap-6">
                          <div className="bg-rose-500/5 border border-rose-500/20 rounded-lg p-5">
                            <div className="flex items-start gap-3">
                              <AlertTriangle size={20} className="text-rose-500 flex-shrink-0 mt-0.5"/>
                              <div>
                                <h4 className="text-sm font-bold text-rose-400">Deep Attack Vector Warning</h4>
                                <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                                  This scan will execute highly aggressive payloads, including SQL injection, XSS, and CSRF simulations. It is extremely noisy and will continue running until all endpoint permutations are exhausted. Do not run on production databases during peak hours.
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="bg-[#09090b] border border-zinc-800 rounded-lg overflow-hidden transition-colors">
                            <button 
                              onClick={() => setShowDastConfig(!showDastConfig)}
                              className="w-full flex items-center justify-between p-4 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors hover:bg-zinc-900/50"
                            >
                              <div className="flex items-center gap-2">
                                <Box size={14} className={showDastConfig ? 'text-indigo-400' : ''} />
                                Engine Configurations
                              </div>
                              <ChevronRight size={14} className={`transition-transform duration-300 ${showDastConfig ? 'rotate-90' : ''}`} />
                            </button>

                            <AnimatePresence>
                              {showDastConfig && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-zinc-800 bg-black/50">
                                  <div className="p-5 flex flex-col gap-5">
                                    <div>
                                      <div className="flex justify-between items-center mb-2">
                                        <label className="text-[16px] text-zinc-500 font-bold uppercase tracking-widest">Concurrent Threads</label>
                                        <span className="text-xs font-black text-indigo-400">{dastConfig.concurrency}</span>
                                      </div>
                                      <input 
                                        type="range" min="1" max="50" 
                                        value={dastConfig.concurrency}
                                        onChange={(e) => setDastConfig({...dastConfig, concurrency: parseInt(e.target.value)})}
                                        className="w-full accent-indigo-500"
                                      />
                                      <p className="text-[10px] text-zinc-600 uppercase mt-1">Higher values increase speed but risk Denial of Service.</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <button 
                                        onClick={() => setDastConfig({...dastConfig, smartThrottling: !dastConfig.smartThrottling})}
                                        className={`flex items-center justify-between p-3 rounded border text-left transition-colors ${dastConfig.smartThrottling ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
                                      >
                                        <div><p className="text-[12px] font-bold uppercase tracking-widest">Smart Throttling</p><p className="text-[9px] opacity-90 uppercase mt-0.5">Auto-delay if server lags</p></div>
                                        <div className={`w-3 h-3 rounded-full ${dastConfig.smartThrottling ? 'bg-indigo-400 shadow-[0_0_10px_#818cf8]' : 'bg-zinc-700'}`} />
                                      </button>

                                      <button 
                                        onClick={() => setDastConfig({...dastConfig, recursiveCrawl: !dastConfig.recursiveCrawl})}
                                        className={`flex items-center justify-between p-3 rounded border text-left transition-colors ${dastConfig.recursiveCrawl ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
                                      >
                                        <div><p className="text-[12px] font-bold uppercase tracking-widest">Recursive Crawl</p><p className="text-[9px] opacity-90 uppercase mt-0.5">Map every nested directory</p></div>
                                        <div className={`w-3 h-3 rounded-full ${dastConfig.recursiveCrawl ? 'bg-rose-400 shadow-[0_0_10px_#fb7185]' : 'bg-zinc-700'}`} />
                                      </button>
                                    </div>

                                    <div>
                                      <label className="text-[12px] text-zinc-500 font-bold uppercase tracking-widest mb-2 block">Custom Headers / Auth</label>
                                      <textarea 
                                        value={dastConfig.customHeaders}
                                        onChange={(e) => setDastConfig({...dastConfig, customHeaders: e.target.value})}
                                        placeholder="Authorization: Bearer token..."
                                        className="w-full bg-[#050505] border border-zinc-800 rounded p-3 text-xs text-zinc-300 font-mono focus:border-indigo-500 outline-none h-20 resize-none placeholder:text-zinc-700"
                                      />
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          <button 
                            onClick={() => runScan('web', 'web', { target: targetUrl, timeLimit: 0, type: 'deep', config: dastConfig })} 
                            disabled={scanState.isActive} 
                            className="w-full relative overflow-hidden inline-flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-4 py-3.5 rounded-lg text-sm font-bold transition-all disabled:opacity-50 group"
                          >
                            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] bg-[position:200%_0,0_0] bg-no-repeat transition-[background-position_0s_ease] hover:bg-[position:-100%_0,0_0] duration-[1500ms]" />
                            <Bug size={18} /> Execute Full DAST Sweep
                          </button>
                        </motion.div>

                      )}
                    </AnimatePresence>
                    {renderProgressBar('web')}
                  </div>
                  {renderFindingsList(activeWeb)}
                </motion.div>
              )}

              {/* CONTAINER SECURITY PAGE */}
              {activeTab === 'Container Security' && (
                <motion.div key="container" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <div className="mb-8 relative z-20"><h2 className="text-2xl font-bold text-white tracking-tight">Container Runtime Security</h2><p className="text-sm text-zinc-500 mt-1">Scan Docker images for OS-level vulnerabilities and CVEs.</p></div>
                  <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800 rounded-xl p-6 flex flex-col gap-3 relative z-20">
                    <div className="flex gap-3">
                      <div className="relative flex-1"><Box className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16}/><input type="text" value={dockerImage} onChange={(e) => setDockerImage(e.target.value)} className="w-full bg-[#09090b] border border-zinc-800 rounded-md py-2 pl-10 pr-4 text-sm text-zinc-200 outline-none" placeholder="docker-image:tag" /></div>
                      <button onClick={() => runScan('container', 'container', { image: dockerImage })} disabled={scanState.isActive} className="inline-flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2 rounded-md text-sm font-medium transition-all disabled:opacity-50">Analyze Image</button>
                    </div>
                    {renderProgressBar('container')}
                  </div>
                  {renderFindingsList(activeContainer)}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* --- TOAST NOTIFICATIONS --- */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div key={t.id} initial={{ opacity: 0, x: 50, scale: 0.9 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }} className="bg-zinc-900 border border-zinc-800 shadow-2xl rounded-lg p-4 flex items-start gap-3 w-80 pointer-events-auto">
              {t.type === 'success' ? <CheckCircle size={20} className="text-emerald-500 mt-0.5 flex-shrink-0" /> : t.type === 'error' ? <XCircle size={20} className="text-rose-500 mt-0.5 flex-shrink-0" /> : <Info size={20} className="text-blue-500 mt-0.5 flex-shrink-0" />}
              <div className="flex-1"><h4 className="text-sm font-semibold text-white capitalize">{t.type}</h4><p className="text-xs text-zinc-400 mt-1 leading-snug">{t.message}</p></div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* --- THREAT TRIAGE ENGINE MODAL --- */}
      <AnimatePresence>
        {isRuleEngineOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-[#000]/80 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-[#0c0c0e] w-full max-w-3xl rounded-xl border border-zinc-800 shadow-[0_0_50px_rgba(0,0,0,1)] flex flex-col overflow-hidden font-mono">
              
              <div className="px-6 py-4 bg-zinc-900/80 border-b border-zinc-800 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Sliders size={18} className="text-indigo-400" />
                  <span className="text-xs font-black text-white uppercase tracking-widest">Threat Prioritization Matrix</span>
                </div>
                <X onClick={() => setIsRuleEngineOpen(false)} size={18} className="text-zinc-500 hover:text-white cursor-pointer transition-colors" />
              </div>
              
              <div className="p-8 bg-[#050505] flex-1 overflow-y-auto max-h-[70vh] scrollbar-hide">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 mb-10">
                  <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                    <Sparkles size={16}/> Create Deterministic Rule
                  </h4>
                  <div className="flex flex-col md:flex-row gap-5">
                    <div className="flex-1">
                      <label className="text-xs text-zinc-400 uppercase tracking-widest mb-2 block font-semibold">If Vulnerability Title Contains:</label>
                      <input 
                        type="text" 
                        value={newRuleCondition} 
                        onChange={(e) => setNewRuleCondition(e.target.value)} 
                        placeholder="e.g., clickjacking, sql, headers..." 
                        className="w-full bg-[#09090b] border border-zinc-800 rounded-lg py-3 px-4 text-sm text-white outline-none focus:border-indigo-500 font-mono shadow-inner transition-colors" 
                      />
                    </div>
                    <div className="w-full md:w-48">
                      <label className="text-xs text-zinc-400 uppercase tracking-widest mb-2 block font-semibold">Force Severity To:</label>
                      <select 
                        value={newRuleSeverity} 
                        onChange={(e) => setNewRuleSeverity(e.target.value)} 
                        className="w-full bg-[#09090b] border border-zinc-800 rounded-lg py-3 px-4 text-sm text-white outline-none focus:border-indigo-500 font-mono shadow-inner cursor-pointer"
                      >
                        <option value="Critical">Critical</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button onClick={handleAddRule} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-lg text-sm font-bold transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] w-full md:w-auto h-[46px]">
                        Deploy Rule
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-5">
                  <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Active Triage Rules</h4>
                  <span className="text-xs text-zinc-600 font-mono italic">Drag to reorder priority</span>
                </div>

                <div className="space-y-4">
                  {customRules.length === 0 ? (
                    <div className="border border-dashed border-zinc-800 rounded-xl p-10 text-center">
                      <p className="text-sm text-zinc-600 font-mono uppercase tracking-widest">No active rules. Running on default scanner scores.</p>
                    </div>
                  ) : (
                    customRules.map((rule, index) => (
                      <div 
                        key={rule.id}
                        draggable
                        onDragStart={(e) => (dragItem.current = index)}
                        onDragEnter={(e) => (dragOverItem.current = index)}
                        onDragEnd={handleSortRules}
                        onDragOver={(e) => e.preventDefault()}
                        className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl p-5 flex justify-between items-center transition-all group cursor-move shadow-md"
                      >
                        <div className="flex items-center gap-4">
                          <GripVertical size={20} className="text-zinc-600 group-hover:text-zinc-300 transition-colors" />
                          <div>
                            <p className="text-sm font-bold text-zinc-100 mb-1.5">{rule.name}</p>
                            <p className="text-xs text-zinc-400 font-mono">
                              IF title contains <span className="text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded mx-1">"{rule.conditionMatch}"</span> ➡️ SET TO <span className={`font-bold ml-1 ${rule.newSeverity === 'Critical' ? 'text-rose-500' : rule.newSeverity === 'High' ? 'text-orange-500' : 'text-blue-400'}`}>{rule.newSeverity}</span>
                            </p>
                          </div>
                        </div>
                        <button onClick={() => handleDeleteRule(rule.id)} className="text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10 transition-colors p-2.5 rounded-lg opacity-0 group-hover:opacity-100">
                          <Trash2 size={18}/>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="px-6 py-4 bg-zinc-900/80 border-t border-zinc-800 flex justify-end">
                <button onClick={() => setIsRuleEngineOpen(false)} className="text-[10px] font-bold text-zinc-500 hover:text-zinc-300 uppercase tracking-widest transition-colors">Close Console</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- AI NEURAL CHAT MODAL --- */}
      <AnimatePresence>
        {aiModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-[#000]/90 backdrop-blur-sm flex items-center justify-center p-4 z-[70]">
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="bg-[#0c0c0e] w-full max-w-4xl rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-zinc-800 overflow-hidden flex flex-col h-[85vh]">
              
              {/* Header */}
              <div className="px-6 py-4 bg-zinc-900/80 border-b border-zinc-800 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <TerminalSquare size={18} className="text-indigo-400" />
                  <div>
                    <h3 className="text-sm font-black text-zinc-100 uppercase tracking-widest">NexusSec Neural Interface</h3>
                    <p className="text-[10px] text-zinc-500 font-mono mt-0.5 truncate max-w-lg">TARGET: {aiModal.Issue}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleClearChat(aiModal.Issue)} className="text-zinc-500 hover:text-rose-500 p-2 rounded-md hover:bg-rose-500/10 transition-colors" title="Discard Chat History">
                    <Trash2 size={16}/>
                  </button>
                  <button onClick={() => setAiModal(null)} className="text-zinc-500 hover:text-white p-2 rounded-md hover:bg-zinc-800 transition-colors" title="Close Window">
                    <X size={16}/>
                  </button>
                </div>
              </div>

              {/* ✨ TAB SWITCHER */}
              <div className="flex border-b border-zinc-800 bg-[#09090b]">
                <button 
                  onClick={() => setAiModalTab('chat')} 
                  className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-widest border-b-2 transition-colors ${aiModalTab === 'chat' ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' : 'border-transparent text-zinc-600 hover:text-zinc-400 hover:bg-zinc-900/50'}`}
                >
                  Remediation Chat
                </button>
                <div className="w-px bg-zinc-800"></div>
                <button 
                  onClick={() => setAiModalTab('exploit')} 
                  className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-widest border-b-2 transition-colors flex items-center justify-center gap-2 ${aiModalTab === 'exploit' ? 'border-rose-500 text-rose-400 bg-rose-500/5' : 'border-transparent text-zinc-600 hover:text-zinc-400 hover:bg-zinc-900/50'}`}
                >
                  <Bug size={14} /> Offensive PoC
                </button>
              </div>
              
              {aiModalTab === 'chat' ? (
                <>
                  <div className="p-6 overflow-y-auto flex-1 bg-[#050505] space-y-6 scrollbar-hide">
                    {aiModal.messages?.map((msg, idx) => (
                      <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className="flex items-center gap-2 mb-1.5 px-1">
                          {msg.role === 'assistant' ? (
                            <><Sparkles size={12} className="text-indigo-400"/> <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Neural Core</span></>
                          ) : (
                            <><span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Security Operator</span></>
                          )}
                        </div>
                        <div className={`p-4 rounded-xl max-w-[85%] ${msg.role === 'user' ? 'bg-indigo-600/20 border border-indigo-500/30 text-zinc-200 text-sm' : 'bg-zinc-900/80 border border-zinc-800 shadow-inner'}`}>
                          {msg.role === 'user' ? <p>{msg.content}</p> : <div className="font-sans text-sm text-zinc-300 leading-relaxed whitespace-normal ai-markdown-wrapper" dangerouslySetInnerHTML={{ __html: formatAiResponse(msg.content) }} />}
                        </div>
                      </div>
                    ))}
                    {aiLoading && (
                      <div className="flex flex-col items-start">
                        <div className="flex items-center gap-2 mb-1.5 px-1">
                          <Sparkles size={12} className="text-indigo-400 animate-pulse"/> <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest animate-pulse">Computing</span>
                        </div>
                        <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center gap-3">
                          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                  <div className="p-4 bg-zinc-900/80 border-t border-zinc-800 shrink-0">
                    <div className="relative flex items-center">
                      <input 
                        type="text" 
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleChatSend()}
                        placeholder="Ask follow-up questions, request exploit scripts, or ask for framework-specific fixes..."
                        className="w-full bg-[#050505] border border-zinc-700 hover:border-zinc-600 focus:border-indigo-500 rounded-lg py-3.5 pl-4 pr-12 text-sm text-zinc-200 outline-none transition-colors shadow-inner font-mono placeholder:text-zinc-600"
                        disabled={aiLoading}
                      />
                      <button 
                        onClick={handleChatSend}
                        disabled={aiLoading || !chatInput.trim()}
                        className="absolute right-2 p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md transition-colors disabled:opacity-50 disabled:hover:bg-indigo-600"
                      >
                        <Send size={16} />
                      </button>
                    </div>
                    <p className="text-[9px] text-zinc-600 text-center mt-2 font-mono uppercase tracking-widest">NexusSec Neural Models can hallucinate. Verify critical code.</p>
                  </div>
                </>
              ) : (
                <div className="p-6 overflow-y-auto flex-1 bg-[#050505] scrollbar-hide">
                  {!pocData[aiModal.Issue] && !pocLoading ? (
                    <div className="flex flex-col items-center justify-center h-full">
                      <div className="bg-rose-500/10 p-6 rounded-full border border-rose-500/20 mb-6">
                        <Bug size={48} className="text-rose-500/60" />
                      </div>
                      <h3 className="text-lg font-bold text-zinc-200 mb-2">Red Team Payload Generator</h3>
                      <p className="text-zinc-500 text-sm mb-8 text-center max-w-md leading-relaxed">
                        Deploy the Neural Engine to synthesize a highly targeted, benign Proof of Concept (PoC) script to validate this vulnerability in your DevSecOps environment.
                      </p>
                      <button 
                        onClick={() => generatePoC(aiModal)} 
                        className="bg-rose-600/10 border border-rose-500/40 text-rose-400 hover:bg-rose-600/20 px-8 py-3.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-3 shadow-[0_0_15px_rgba(244,63,94,0.15)]"
                      >
                        <Zap size={18} /> Synthesize Exploit Payload
                      </button>
                    </div>
                  ) : pocLoading ? (
                    <div className="flex flex-col items-center justify-center h-full">
                      <Activity size={32} className="text-rose-500 animate-spin mb-4" />
                      <p className="text-rose-400 text-xs font-bold uppercase tracking-widest animate-pulse">Drafting Offensive Payload...</p>
                    </div>
                  ) : (
                    <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-6 h-full shadow-inner overflow-y-auto">
                       <div className="flex items-center gap-2 mb-4 pb-4 border-b border-zinc-800">
                          <Bug size={16} className="text-rose-500"/> 
                          <span className="text-xs font-bold text-rose-400 uppercase tracking-widest">Active Payload Configured</span>
                       </div>
                       <div className="font-sans text-sm text-zinc-300 leading-relaxed whitespace-normal ai-markdown-wrapper" dangerouslySetInnerHTML={{ __html: formatAiResponse(pocData[aiModal.Issue]) }} />
                    </div>
                  )}
                </div>
              )}

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;