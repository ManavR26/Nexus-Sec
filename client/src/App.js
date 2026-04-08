import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, Code2, Globe, Box, LayoutGrid, Download, Trash2, Github, 
  Activity, AlertTriangle, BookOpen, ChevronLeft, ChevronRight, Filter, X, 
  TerminalSquare, Sparkles, Server, Zap, Bug, FileCode2, LogOut, Bell, 
  CheckCircle, XCircle, Info, Clock, FileText, Sliders, GripVertical, Send,
  ShieldCheck, Scale, FileCode, HardDrive, User, Key, Database,
  Shield, Lock, ChevronDown // ✨ Added these two right here at the end!
} from 'lucide-react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, PieChart, Pie } from 'recharts';

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

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// ==========================================
// 🚀 MAIN APPLICATION
// ==========================================
function App() {
  const GITHUB_CLIENT_ID = 'Ov23liXyjQdoLdOKk4lt';

  // --- CORE UI STATE ---
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [aiModal, setAiModal] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const messagesEndRef = useRef(null);
  const [isExportHovered, setIsExportHovered] = useState(false);
  const [containerScanMode, setContainerScanMode] = useState('image');
  const [dockerfileContent, setDockerfileContent] = useState('');

  // ✨ RBAC AUTHENTICATION STATE
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem('nexusAuth') === 'true');
  const [userRole, setUserRole] = useState(() => localStorage.getItem('nexusRole') || 'admin');
  const [loginForm, setLoginForm] = useState({ role: 'admin', password: '' });
  const [loginError, setLoginError] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);
  // Hardcoded Demo Credentials
  const ROLE_CREDENTIALS = {
    admin: process.env.REACT_APP_ADMIN_PASS,
    developer: process.env.REACT_APP_DEV_PASS,
    auditor: process.env.REACT_APP_AUDITOR_PASS
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (ROLE_CREDENTIALS[loginForm.role] === loginForm.password) {
      setLoginError('');
      setIsUnlocking(true); 

      setTimeout(() => {
        setIsAuthenticated(true);
        setUserRole(loginForm.role);
        localStorage.setItem('nexusAuth', 'true');
        localStorage.setItem('nexusRole', loginForm.role);
        setIsUnlocking(false); 

        // ✨ NEW: Check mailbox and trigger notifications for Developers
        if (loginForm.role === 'developer') {
          const resolved = JSON.parse(localStorage.getItem('resolvedDismissals')) || [];
          if (resolved.length > 0) {
            // Wait 800ms for the dashboard to finish animating in, then fire the toasts!
            setTimeout(() => {
              resolved.forEach(res => {
                if (res.status === 'approved') {
                  notify('success', `Admin APPROVED your dismissal request for: ${res.issueId}`);
                } else {
                  notify('error', `Admin DENIED your dismissal request for: ${res.issueId}`);
                }
              });
              // Empty the mailbox so they don't see it again next time
              setResolvedDismissals([]);
            }, 800);
          }
        }
      }, 600); 
    } else {
      setLoginError('Invalid credentials for selected role.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole('admin');
    localStorage.removeItem('nexusAuth');
    localStorage.removeItem('nexusRole');
  };

  // 🛡️ DAST Ethical Warning State
  const [dastWarningAccepted, setDastWarningAccepted] = useState(() => {
    return sessionStorage.getItem('dastWarningAccepted') === 'true';
  });
  const [dastWarningCountdown, setDastWarningCountdown] = useState(3);

  useEffect(() => {
    let timer;
    if (activeTab === 'Penetration Test' && !dastWarningAccepted && dastWarningCountdown > 0) {
      timer = setInterval(() => {
        setDastWarningCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [activeTab, dastWarningAccepted, dastWarningCountdown]);

  const handleAcceptDastWarning = () => {
    setDastWarningAccepted(true);
    sessionStorage.setItem('dastWarningAccepted', 'true');
  };

  // 🗄️ Database Security State
  const [dbConfig, setDbConfig] = useState({
    db_type: 'mysql',
    host: 'localhost',
    port: '3306',
    user: 'root',
    password: ''
  });
  const [dbFindings, setDbFindings] = useState(() => JSON.parse(localStorage.getItem('dbFindings')) || []);
  useEffect(() => { localStorage.setItem('dbFindings', JSON.stringify(dbFindings)); }, [dbFindings]);

  // --- 🧠 AI STATE ---
  const [aiModalTab, setAiModalTab] = useState('chat');
  const [redTeamHistory, setRedTeamHistory] = useState(() => JSON.parse(localStorage.getItem('redTeamHistory')) || {});
  const [showRedTeamWarning, setShowRedTeamWarning] = useState(true);
  const [redTeamLoading, setRedTeamLoading] = useState(false);
  
  useEffect(() => { localStorage.setItem('redTeamHistory', JSON.stringify(redTeamHistory)); }, [redTeamHistory]);

  const [chatHistories, setChatHistories] = useState(() => JSON.parse(localStorage.getItem('chatHistories')) || {});
  const [pocData, setPocData] = useState(() => JSON.parse(localStorage.getItem('pocData')) || {});
  const [pocLoading, setPocLoading] = useState(false);
  
  useEffect(() => { localStorage.setItem('chatHistories', JSON.stringify(chatHistories)); }, [chatHistories]);
  useEffect(() => { localStorage.setItem('pocData', JSON.stringify(pocData)); }, [pocData]);

  // --- NOTIFICATION SYSTEM ---
  const [notifications, setNotifications] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

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
  const lastTargetsRef = useRef({ github: '', web: '', container: '', dockerfile: '', db: '' });

  // ✨ HEURISTIC TREND ENGINE STATE & LOGIC
  const [scanHistory, setScanHistory] = useState(() => JSON.parse(localStorage.getItem('scanHistory')) || {
    sast: 0, dast: 0, container: 0, db: 0, total: 0
  });
  useEffect(() => { localStorage.setItem('scanHistory', JSON.stringify(scanHistory)); }, [scanHistory]);

  const generateTrendBadge = (oldVal, newVal, isDb = false) => {
    if (oldVal === 0 && newVal === 0) return { text: isDb ? 'Audit Passed' : 'Awaiting Scan', color: 'zinc', icon: Clock };
    if (newVal > oldVal) {
      const diff = newVal - oldVal;
      if (diff >= 10) return { text: `Critical Spike (+${diff})`, color: 'rose', icon: AlertTriangle };
      return { text: `Elevated (+${diff})`, color: 'rose', icon: Activity };
    }
    if (newVal < oldVal) return { text: `Mitigated (-${oldVal - newVal})`, color: 'emerald', icon: CheckCircle };
    if (newVal === oldVal && newVal > 0) return { text: 'Threats Stagnant', color: 'amber', icon: ShieldAlert };
    return { text: 'Audit Passed', color: 'emerald', icon: ShieldCheck };
  };

  

  // --- PERSISTENT SESSION STATE ---
  const [githubFindings, setGithubFindings] = useState(() => JSON.parse(localStorage.getItem('githubFindings')) || []);
  const [webFindings, setWebFindings] = useState(() => JSON.parse(localStorage.getItem('webFindings')) || []);
  const [registryFindings, setRegistryFindings] = useState(() => JSON.parse(localStorage.getItem('registryFindings')) || []);
  const [dockerfileFindings, setDockerfileFindings] = useState(() => JSON.parse(localStorage.getItem('dockerfileFindings')) || []);
  const [resolvedFindings, setResolvedFindings] = useState(() => JSON.parse(localStorage.getItem('resolvedFindings')) || []);

  useEffect(() => { 
    localStorage.setItem('resolvedFindings', JSON.stringify(resolvedFindings)); 
  }, [resolvedFindings]);

  const [ignoredIds, setIgnoredIds] = useState(() => JSON.parse(localStorage.getItem('ignoredIds')) || []);
  // ✨ MAKER/CHECKER WORKFLOW STATE
  const [pendingDismissals, setPendingDismissals] = useState(() => JSON.parse(localStorage.getItem('pendingDismissals')) || {});
  const [reviewingIssue, setReviewingIssue] = useState(null);
  useEffect(() => { localStorage.setItem('pendingDismissals', JSON.stringify(pendingDismissals)); }, [pendingDismissals]);

  // ✨ NEW: Mailbox for resolved requests
  const [resolvedDismissals, setResolvedDismissals] = useState(() => JSON.parse(localStorage.getItem('resolvedDismissals')) || []);
  useEffect(() => { localStorage.setItem('resolvedDismissals', JSON.stringify(resolvedDismissals)); }, [resolvedDismissals]);

  // ✨ IMMUTABLE AUDIT TRAIL (LEDGER)
  const [auditTrail, setAuditTrail] = useState(() => JSON.parse(localStorage.getItem('auditTrail')) || []);
  useEffect(() => { localStorage.setItem('auditTrail', JSON.stringify(auditTrail)); }, [auditTrail]);
  const [showLedger, setShowLedger] = useState(false);

  // Helper function to easily write to the ledger
  const logToLedger = (actorRole, actionType, targetIssue) => {
    const newEntry = {
      id: Date.now(),
      timestamp: new Date().toLocaleString(),
      actor: actorRole,
      action: actionType,
      target: targetIssue
    };
    setAuditTrail(prev => [newEntry, ...prev]); // Adds newest to the top
  };

  // ✨ ULTRA-STRICT CONTAINER INPUT VALIDATION GATEWAY
  const validateContainerInput = (inputValue, scanType) => {
    if (!inputValue || inputValue.trim() === '') {
      notify('error', 'Input cannot be empty.');
      return false;
    }

    if (scanType === 'registry') {
      // STRICT REGEX: Must contain a colon to enforce tags (e.g. ubuntu:latest). Rejects plain words like "hello".
      const dockerImageRegex = /^[a-zA-Z0-9.\-_/]+:[a-zA-Z0-9.\-_]+$/;
      if (!dockerImageRegex.test(inputValue.trim())) {
        notify('error', 'Strict Policy: Please specify an image tag (e.g., node:14-alpine). Single words are not allowed.');
        return false;
      }
    } else if (scanType === 'raw') {
      // STRICT REGEX: "FROM" must be at the very start of the string or the start of a new line.
      const hasDockerFrom = /(^|\n)FROM\s+/.test(inputValue);
      const hasK8sApi = /(^|\n)apiVersion:\s+/i.test(inputValue);
      const hasTerraform = /(^|\n)resource\s+"/i.test(inputValue);

      if (!hasDockerFrom && !hasK8sApi && !hasTerraform) {
        notify('error', 'Invalid IaC script. Must be a valid Dockerfile (starting with FROM), Kubernetes YAML, or Terraform config.');
        return false;
      }
    }
    return true; 
  };

  const handleRequestDismissal = (issueId) => {
    setPendingDismissals(prev => ({ ...prev, [issueId]: { requester: userRole, timestamp: new Date().toLocaleTimeString() } }));
    logToLedger(userRole, 'REQUESTED EXCEPTION', issueId); // ✨ NEW
    notify('info', 'Dismissal request routed to DevSecOps Admin.');
  };

  const handleApproveDismissal = (issueId) => {
    // 1. Remove from active view
    setIgnoredIds(prev => [...prev, issueId]); 
    
    // 2. Clear from pending requests
    const updated = { ...pendingDismissals };
    delete updated[issueId];
    setPendingDismissals(updated);
    setResolvedDismissals(prev => [...prev, { issueId, status: 'approved' }]);
    
    // 3. Log to Immutable Ledger
    logToLedger('admin', 'APPROVED EXCEPTION', issueId); 

    // ✨ NEW: Add to Remediation History as a Dismissal
    const findingToDismiss = allActiveFindings.find(f => f.Issue === issueId) || { Issue: issueId, Type: 'Unknown', Severity: 'Unknown' };
    setResolvedFindings(prev => [{
      ...findingToDismiss,
      resolvedAt: new Date().toLocaleString(),
      resolvedBy: userRole,
      status: 'Risk Accepted (Dismissed)', // Labels it differently from a real fix
      origin: 'Manual Exception',
      File: findingToDismiss.File || 'System Exception'
    }, ...prev]);

    notify('success', 'Vulnerability exception approved and recorded to history.');
  };

  const handleDenyDismissal = (issueId) => {
    const updated = { ...pendingDismissals };
    delete updated[issueId];
    setPendingDismissals(updated);
    setResolvedDismissals(prev => [...prev, { issueId, status: 'denied' }]);
    logToLedger('admin', 'DENIED EXCEPTION', issueId); // ✨ NEW
    notify('error', 'Vulnerability exception denied. Fix required.');
  };

  const [githubToken, setGithubToken] = useState(() => sessionStorage.getItem('githubToken') || null);
  const [userRepos, setUserRepos] = useState(() => JSON.parse(sessionStorage.getItem('userRepos')) || []);
  
  const [severityFilter, setSeverityFilter] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const [repo, setRepo] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [containerImage, setContainerImage] = useState('');
 // ⚡ OWASP ZAP DAST STATE
  const [showZapConfig, setShowZapConfig] = useState(false);
  const [zapConfig, setZapConfig] = useState({
    features: ['spider', 'passive', 'active'], 
    scanStrength: 'Default',
    stealthMode: false, 
  });

  const toggleZapFeature = (featureId) => {
    setZapConfig(prev => {
      const isSelected = prev.features.includes(featureId);
      return {
        ...prev,
        features: isSelected 
          ? prev.features.filter(t => t !== featureId)
          : [...prev.features, featureId]
      };
    });
  };

  useEffect(() => { localStorage.setItem('githubFindings', JSON.stringify(githubFindings)); }, [githubFindings]);
  useEffect(() => { localStorage.setItem('webFindings', JSON.stringify(webFindings)); }, [webFindings]);
  useEffect(() => { localStorage.setItem('registryFindings', JSON.stringify(registryFindings)); }, [registryFindings]);
  useEffect(() => { localStorage.setItem('dockerfileFindings', JSON.stringify(dockerfileFindings)); }, [dockerfileFindings]);
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
      const response = await axios.post(`${API_BASE}/api/ai/triage`, { findings: currentFindings });
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
      axios.post(`${API_BASE}/api/auth/github`, { code })
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
  const processedRegistry = applyRulesToFindings(registryFindings);
  const processedDockerfile = applyRulesToFindings(dockerfileFindings);
  const processedDb = applyRulesToFindings(dbFindings);

  const getActiveFindings = (findingsList) => findingsList.filter(f => !ignoredIds.includes(f.Issue) && (severityFilter.length === 0 || severityFilter.includes(f.Severity)));
  
  const activeGithub = getActiveFindings(processedGithub);
  const activeWeb = getActiveFindings(processedWeb);
  // --- 1. Registry Scan: Only show live OS/Package CVEs ---
const activeRegistry = getActiveFindings(processedRegistry).filter(f => 
  f.Type.includes('Container OS Vulnerability')
);

// --- 2. Dockerfile Scan: Only show the hardcoded code-level bugs ---
const activeDockerfile = getActiveFindings(processedDockerfile).filter(f => 
  f.Type.includes('Dockerfile Security')
);
  const activeDb = getActiveFindings(processedDb);

  // ✨ MAGIC MERGE: We combine them here so your global Dashboard Charts & KPI counts stay accurate!
  const activeContainer = [...activeRegistry, ...activeDockerfile];

  const totalIssues = activeGithub.length + activeWeb.length + activeContainer.length + activeDb.length;
  const allActiveFindings = [...activeGithub, ...activeWeb, ...activeContainer, ...activeDb];

  // ✨ CALCULATE LIVE TREND BADGES
  const totalTrend = generateTrendBadge(scanHistory.total, totalIssues);
  const sastTrend = generateTrendBadge(scanHistory.sast, activeGithub.length);
  const dastTrend = generateTrendBadge(scanHistory.dast, activeWeb.length);
  const containerTrend = generateTrendBadge(scanHistory.container, activeContainer.length);
  const dbTrend = generateTrendBadge(scanHistory.db, activeDb.length, true);

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

  const calculateEngineeringDebt = (findings) => {
    return findings.reduce((total, f) => {
      if (f.Severity === 'Critical') return total + 8;
      if (f.Severity === 'High') return total + 4;
      if (f.Severity === 'Medium') return total + 2;
      return total + 1;
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
  const dbChartData = getSeverityData(activeDb);  
  // ✨ NEW: Global Severity Data for the Doughnut Chart
  const globalSeverityData = [
    { name: 'Critical', value: allActiveFindings.filter(f => f.Severity?.toUpperCase() === 'CRITICAL' || f.Severity?.toUpperCase() === 'HIGH').length, color: '#f43f5e' },
    { name: 'High', value: allActiveFindings.filter(f => f.Severity?.toUpperCase() === 'HIGH' && f.Severity !== 'CRITICAL').length, color: '#f97316' },
    { name: 'Medium', value: allActiveFindings.filter(f => f.Severity?.toUpperCase() === 'MEDIUM').length, color: '#eab308' },
    { name: 'Low', value: allActiveFindings.filter(f => f.Severity?.toUpperCase() === 'LOW').length, color: '#3b82f6' },
  ].filter(d => d.value > 0);

  const handleResetEngine = () => {
    setGithubFindings([]); setWebFindings([]); setRegistryFindings([]); setDockerfileFindings([]); setIgnoredIds([]);
    setAiTriageData({}); 
    setResolvedFindings([]);
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
    if (type === 'db') { data = activeDb; title = "Database_Security_Report"; }

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

    // Determine the exact target being scanned so we don't mix up different repos/images
    let currentTarget = '';
    if (type === 'github') currentTarget = payload.repo;
    if (type === 'web') currentTarget = payload.target;
    if (type === 'container') currentTarget = payload.image;
    if (type === 'dockerfile') currentTarget = 'raw_dockerfile_input';

    notify('info', `Initializing ${type.toUpperCase()} scan...`);
    setScanState({ isActive: true, type, progress: 0, phase: 'Engine warming up...' });

    scanTimerRef.current = setInterval(() => {
      setScanState(prev => ({
        ...prev,
        progress: Math.min(95, prev.progress + 2),
        phase: 'Active Analysis...'
      }));
    }, 800);

    try {
      const response = await axios.post(`${API_BASE}/api/scan/${endpoint}`, payload);
      
      clearInterval(scanTimerRef.current);
      setScanState(prev => ({ ...prev, progress: 100, phase: 'Generating report...' }));

      setTimeout(() => {
        const incoming = response.data.findings || [];

        // ✨ NEW: AUTO-RESOLVER LOGIC ✨
        const isSameTarget = lastTargetsRef.current[type] === currentTarget;
        lastTargetsRef.current[type] = currentTarget;

        let oldFindings = [];
        if (type === 'github') oldFindings = githubFindings;
        if (type === 'web') oldFindings = webFindings;
        if (type === 'container') oldFindings = registryFindings;
        if (type === 'dockerfile') oldFindings = dockerfileFindings;

        // If scanning the same target again, check for missing bugs (they were fixed!)
        if (isSameTarget && oldFindings.length > 0) {
          const fixedBugs = oldFindings.filter(oldBug => 
            !incoming.some(newBug => newBug.Issue === oldBug.Issue)
          );

          if (fixedBugs.length > 0) {
            const newlyResolved = fixedBugs.map(bug => ({
              ...bug,
              resolvedAt: new Date().toLocaleString(),
              resolvedBy: 'Auto-Scanner System',
              status: 'Remediated (Solved)',
              origin: type.toUpperCase(),
              File: bug.File || currentTarget
            }));
            
            setResolvedFindings(prev => [...newlyResolved, ...prev]);
            logToLedger('system', 'AUTO-VERIFIED FIX', `${fixedBugs.length} issues cleared on ${currentTarget}`);
            notify('success', `Auto-Scan Verified: ${fixedBugs.length} vulnerabilities have been resolved.`);
          }
        }

        // ✨ NEW: Snapshot the old history before updating
        setScanHistory(prev => ({
          ...prev, 
          total: totalIssues,
          sast: type === 'github' ? oldFindings.length : prev.sast,
          dast: type === 'web' ? oldFindings.length : prev.dast,
          container: (type === 'container' || type === 'dockerfile') ? oldFindings.length : prev.container
        }));

        // Update correct bucket with new active findings
        if (type === 'github') setGithubFindings(incoming);
        if (type === 'web') setWebFindings(incoming);
        if (type === 'container') setRegistryFindings(incoming);
        if (type === 'dockerfile') setDockerfileFindings(incoming);

        setScanState({ isActive: false, type: null, progress: 0, phase: '' });
        notify('success', `Scan complete: Found ${incoming.length} active threats.`);
      }, 1000);

    } catch (error) {
      clearInterval(scanTimerRef.current);
      setScanState({ isActive: false, type: null, progress: 0, phase: '' });
      notify('error', 'The scan engine failed to respond.');
    }
  };

  const executeDatabaseScan = async () => {
    setScanState({ isActive: true, progress: 0 });
    setDbFindings([]);

    const progressInterval = setInterval(() => {
      setScanState(prev => ({ ...prev, progress: Math.min(prev.progress + 15, 90) }));
    }, 500);

    try {
      const response = await fetch(`${API_BASE}/api/scan/database`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dbConfig)
      });
      
      const data = await response.json();
      
      if (data.status === 'beta') {
      } else if (data.findings) {
        const incoming = data.findings;
        
        // ✨ THE TARGET LOCK FOR DB
        const currentDbTarget = `${dbConfig.host}:${dbConfig.port}`;
        const isNewDbTarget = lastTargetsRef.current.db !== currentDbTarget;
        lastTargetsRef.current.db = currentDbTarget;

        // Compare Database Config Deltas ONLY if it's the same database
        if (!isNewDbTarget) {
          const fixed = dbFindings.filter(oldBug => 
            !incoming.some(newBug => newBug.Issue === oldBug.Issue)
          );

          if (fixed.length > 0) {
            const newlyResolved = fixed.map(bug => ({
              ...bug,
              resolvedAt: new Date().toLocaleString(),
              resolvedBy: userRole,
              status: 'Remediated',
              origin: 'Database Infrastructure'
            }));
            setResolvedFindings(prev => [...newlyResolved, ...prev]);
            logToLedger(userRole, 'INFRASTRUCTURE HARDENED', `${fixed.length} misconfigurations corrected.`);
            notify('success', `Security Update: ${fixed.length} DB policies corrected.`);
          }
        }
        setScanHistory(prev => ({ ...prev, total: totalIssues, db: dbFindings.length }));
        setDbFindings(incoming);
      } else if (data.error) {
        alert(`Connection Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Database Engine Error:", error);
      alert("Failed to reach the NexusSec Backend Engine.");
    } finally {
      clearInterval(progressInterval);
      setScanState({ isActive: false, progress: 100 });
      setTimeout(() => setScanState(prev => ({ ...prev, progress: 0 })), 2000);
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
      const response = await axios.post(`${API_BASE}/api/ai/remediate`, { finding });
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
      const response = await axios.post(`${API_BASE}/api/ai/chat`, { 
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
  const handleRedTeamChat = async (input) => {
    if (!input.trim() || !aiModal) return;
    
    const issueId = aiModal.Issue;
    const currentHistory = redTeamHistory[issueId] || [];
    const userMsg = { role: 'user', content: input };
    const updatedHistory = [...currentHistory, userMsg];
    
    setRedTeamHistory(prev => ({ ...prev, [issueId]: updatedHistory }));
    setRedTeamLoading(true);

    try {
      const response = await axios.post(`${API_BASE}/api/ai/redteam/chat`, { 
        finding: aiModal, 
        history: updatedHistory 
      });
      
      const finalHistory = [...updatedHistory, { role: 'assistant', content: response.data.reply }];
      setRedTeamHistory(prev => ({ ...prev, [issueId]: finalHistory }));
    } catch (error) {
      notify('error', 'RedTeam transmission failed.');
    }
    setRedTeamLoading(false);
  };

  const handleClearChat = (issueName) => {
    const updatedHistories = { ...chatHistories };
    delete updatedHistories[issueName];
    setChatHistories(updatedHistories);
    
    // ✨ ADD THIS LINE BELOW
    const updatedRedTeam = { ...redTeamHistory };
    delete updatedRedTeam[issueName];
    setRedTeamHistory(updatedRedTeam);
    
    const updatedPoc = { ...pocData };
    delete updatedPoc[issueName];
    setPocData(updatedPoc);
    
    setAiModal(null);
    notify('info', 'All AI context discarded for this issue.');
  };

  const generatePoC = async (finding) => {
    if (pocData[finding.Issue]) return; 
    
    setPocLoading(true);
    notify('info', 'Initializing Offensive Red Team module...');
    
    try {
      const response = await axios.post(`${API_BASE}/api/ai/exploit`, { finding });
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
    
    return (
      <div className="w-full bg-zinc-950 border border-indigo-500/20 rounded-xl p-5 mt-4 relative overflow-hidden shadow-2xl z-20">
        {/* The Actual Moving Bar */}
        <div 
          className="absolute top-0 left-0 h-1 bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-500 ease-out" 
          style={{ width: `${scanState.progress}%` }} 
        />
        
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-indigo-400 animate-pulse" />
            <span className="text-[10px] font-black text-indigo-100 uppercase tracking-widest">{scanState.phase}</span>
          </div>
          <span className="text-xs font-bold text-indigo-400">{scanState.progress}%</span>
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
                <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className={`group relative bg-zinc-900/60 backdrop-blur-md hover:bg-zinc-800/80 p-5 rounded-lg border border-zinc-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 transition-colors ${reviewingIssue === f.Issue ? 'z-[100]' : 'z-10'}`}>
                  <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${f.Severity === 'Critical' || f.Severity === 'High' ? 'bg-rose-500' : f.Severity === 'Medium' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                  
                  {/* ✨ FIX: Added 'min-w-0' and 'w-full' so this left side allows its children to wrap instead of expanding infinitely */}
                  <div className="flex flex-col gap-2 flex-1 min-w-0 pl-2 w-full">
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-sm border flex items-center gap-1.5 w-max ${getSeverityStyles(f.Severity)}`}>{f.Severity || 'UNKNOWN'}</span>
                      <span className="text-zinc-500 text-xs font-mono">{f.Type || 'Vulnerability'}</span>
                    </div>
                    {/* ✨ FIX: Added 'truncate' to stop massive vulnerability titles from breaking the grid */}
                    <h4 className="text-base font-semibold text-zinc-100 font-mono tracking-tight truncate">{f.Issue}</h4>
                    
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
                    
                    {/* ✨ FIX: Removed 'w-max'. Added 'whitespace-normal break-words block w-full'. This forces the text to drop to a new line. */}
                    <code className="text-[10px] text-zinc-400 bg-zinc-950 px-3 py-2 rounded border border-zinc-800 font-mono uppercase tracking-widest whitespace-normal break-words block w-full mt-1">
                      {f.Fix}
                    </code>
                  </div>
                  
                  {/* ✨ FIX: Added 'justify-end' to keep buttons flush right */}
                  <div className="flex items-center justify-end gap-2 flex-shrink-0 w-full md:w-auto mt-2 md:mt-0">
                    {hasChatHistory ? (
                      <button onClick={() => getAiFix(f)} className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-md text-sm font-semibold transition-all shadow-[0_0_10px_rgba(99,102,241,0.4)]">
                        <TerminalSquare size={14} /> Resume Chat
                      </button>
                    ) : (
                      <button onClick={() => getAiFix(f)} className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 bg-white hover:bg-zinc-200 text-black px-4 py-2 rounded-md text-sm font-semibold transition-all">
                        <Sparkles size={14} /> Auto-Fix
                      </button>
                    )}
                    
                    {/* ✨ SMART ROLE-AWARE DISMISSAL BUTTONS */}
                    <div className="relative flex items-center">
                      {pendingDismissals[f.Issue] ? (
                        userRole === 'admin' ? (
                          <div className="relative">
                            <button
                              onClick={() => setReviewingIssue(reviewingIssue === f.Issue ? null : f.Issue)}
                              className={`px-3 py-1.5 border rounded-md text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all ${reviewingIssue === f.Issue ? 'bg-amber-500/20 text-amber-400 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'bg-amber-500/10 text-amber-500 border-amber-500/30 hover:bg-amber-500/20'}`}
                            >
                              <ShieldAlert size={14} className={reviewingIssue === f.Issue ? '' : 'animate-pulse'} /> Review Request
                            </button>

                            {/* ✨ INLINE APPROVE/DENY POPOVER */}
                            <AnimatePresence>
                              {reviewingIssue === f.Issue && (
                                <motion.div
                                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                  className="absolute right-0 bottom-full mb-3 w-72 bg-[#050505] border border-amber-500/30 rounded-xl shadow-[0_15px_40px_-5px_rgba(0,0,0,0.8)] p-4 z-50 origin-bottom-right"
                                >
                                  <p className="text-[10px] text-zinc-400 uppercase tracking-widest mb-3 border-b border-zinc-800 pb-2">
                                    Requested by <span className="text-amber-400 font-bold">{pendingDismissals[f.Issue].requester}</span> • {pendingDismissals[f.Issue].timestamp}
                                  </p>
                                  <div className="flex gap-2">
                                    <button onClick={() => { handleApproveDismissal(f.Issue); setReviewingIssue(null); }} className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg py-2.5 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all">
                                      <CheckCircle size={14} /> Approve
                                    </button>
                                    <button onClick={() => { handleDenyDismissal(f.Issue); setReviewingIssue(null); }} className="flex-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg py-2.5 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all">
                                      <XCircle size={14} /> Deny
                                    </button>
                                  </div>
                                  <div className="absolute -bottom-2 right-6 w-4 h-4 bg-[#050505] border-b border-r border-amber-500/30 transform rotate-45"></div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ) : (
                          <span className="px-3 py-1.5 bg-amber-500/10 text-amber-500 border border-amber-500/30 rounded-md text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-inner whitespace-nowrap">
                            <Clock size={12} className="animate-spin-slow" /> Pending Admin
                          </span>
                        )
                      ) : userRole === 'admin' ? (
                        <button 
                          onClick={() => { 
                            setIgnoredIds([...ignoredIds, f.Issue]); 
                            logToLedger(userRole, 'FORCE DISMISSED', f.Issue);
                            
                            // ✨ NEW: Add to Remediation History as a Force Dismissal
                            setResolvedFindings(prev => [{
                              ...f,
                              resolvedAt: new Date().toLocaleString(),
                              resolvedBy: userRole,
                              status: 'Risk Accepted (Dismissed)',
                              origin: 'Admin Force Override',
                              File: f.File || 'System Exception'
                            }, ...prev]);
                            
                            notify('info', 'Issue forcefully dismissed and logged to History.'); 
                          }} 
                          className="p-2 text-zinc-500 hover:bg-rose-500/10 hover:text-rose-400 rounded-md transition-colors flex-shrink-0" 
                          title="Force Dismiss (Admin)"
                        >
                          <Trash2 size={16} />
                        </button>
                      ) : userRole === 'developer' ? (
                        <button onClick={() => handleRequestDismissal(f.Issue)} className="p-2 text-zinc-500 hover:bg-amber-500/10 hover:text-amber-400 rounded-md transition-colors flex-shrink-0" title="Request Exception">
                          <ShieldAlert size={16} />
                        </button>
                      ) : null}
                    </div>
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


  // ✨ THE LOCKSCREEN INTERCEPTOR
  if (!isAuthenticated) {
    return (
      <motion.div 
        className="fixed inset-0 z-[9999] min-h-screen bg-[#020202] flex items-center justify-center p-4 font-sans selection:bg-emerald-500/30 text-zinc-200"
        animate={isUnlocking ? { opacity: 0, scale: 1.1, filter: "blur(10px)" } : { opacity: 1, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-[#020202] to-[#020202]"></div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="w-full max-w-md min-w-[320px] sm:min-w-[400px] relative z-10" /* ✨ Added min-w to permanently fix the shrinking bug! */
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-3 bg-zinc-900 border border-zinc-800 rounded-2xl mb-4 shadow-2xl shadow-emerald-900/20">
              <Shield size={32} className="text-emerald-500" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Nexus<span className="text-emerald-500">Sec</span></h1>
            <p className="text-zinc-500 text-sm mt-2 tracking-widest uppercase font-semibold">Enterprise IAM Gateway</p>
          </div>

          <form onSubmit={handleLogin} className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6 shadow-2xl">
            {loginError && (
              <div className="bg-rose-500/10 border border-rose-500/50 text-rose-400 text-xs px-4 py-3 rounded-lg mb-6 flex items-center gap-2 font-semibold">
                <AlertTriangle size={14} /> {loginError}
              </div>
            )}

            <div className="mb-5">
              <label className="text-[11px] text-zinc-500 font-bold uppercase tracking-widest mb-2 block">Select Role Profile</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                <select 
                  value={loginForm.role}
                  onChange={(e) => setLoginForm({...loginForm, role: e.target.value})}
                  className="w-full bg-[#050505] border border-zinc-800 rounded-lg py-3 pl-12 pr-4 text-sm text-zinc-200 outline-none focus:border-emerald-500/50 appearance-none cursor-pointer"
                >
                  <option value="admin">DevSecOps Admin (Full Access)</option>
                  <option value="developer">Developer (Scope-Limited)</option>
                  <option value="auditor">Compliance Auditor (Read-Only)</option>
                </select>
              </div>
            </div>

            <div className="mb-6">
              <label className="text-[11px] text-zinc-500 font-bold uppercase tracking-widest mb-2 block">Authentication Key</label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                <input 
                  type="password" 
                  placeholder="Enter your password..." 
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                  className="w-full bg-[#050505] border border-zinc-800 rounded-lg py-3 pl-12 pr-4 text-sm text-zinc-200 outline-none focus:border-emerald-500/50"
                />
              </div>
            </div>

            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm tracking-widest uppercase shadow-lg shadow-emerald-900/20 whitespace-nowrap">
              <Lock size={16} /> Authenticate Session
            </button>

            
          </form>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ duration: 0.8, delay: 0.2 }} 
      className="flex h-screen bg-[#09090b] text-zinc-200 font-sans selection:bg-indigo-500/30 relative"
    >
      
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
          {renderSidebarItem('Compliance & GRC', Scale)}
          
          {isSidebarOpen && <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-3 mt-8 ml-2">Scanners</p>}
          {renderSidebarItem('Source Audit', FileCode2)}
          {renderSidebarItem('Penetration Test', Globe)}
          {renderSidebarItem('Container Security', Box)}
          {renderSidebarItem('Database Security', Database)}
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
              
              {/* ✨ RBAC: RESET ENGINE BUTTON */}
              {userRole !== 'auditor' && (
                <button 
                  onClick={userRole === 'admin' ? handleResetEngine : () => notify('error', 'Clearance Required: Only DevSecOps Admins can purge the global engine state.')} 
                  className={`w-full inline-flex items-center justify-center gap-2 text-xs font-semibold p-2 rounded-md transition-all ${
                    userRole === 'admin' 
                      ? 'text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10' 
                      : 'text-zinc-600 bg-zinc-900/50 border border-zinc-800/50 hover:border-rose-500/30 hover:text-rose-400/50 cursor-not-allowed shadow-inner'
                  }`}
                >
                  {userRole === 'admin' ? <Trash2 size={14}/> : <Lock size={14}/>} 
                  {userRole === 'admin' ? 'Reset Engine' : 'Reset Locked'}
                </button>
              )}
            </motion.div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="bg-zinc-900/80 border border-zinc-800 p-2 rounded-lg flex flex-col items-center" title={`Total Findings: ${totalIssues}`}>
                <Activity className="text-indigo-500/50 mb-1" size={16}/>
                <span className="text-xs font-bold text-white">{totalIssues}</span>
              </div>
              
              {/* ✨ RBAC: RESET ENGINE BUTTON (CLOSED SIDEBAR) */}
              {userRole !== 'auditor' && (
                <button 
                  onClick={userRole === 'admin' ? handleResetEngine : () => notify('error', 'Clearance Required: Only DevSecOps Admins can purge the global engine state.')} 
                  className={`p-2 rounded-md transition-all ${
                    userRole === 'admin' 
                      ? 'text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10' 
                      : 'text-zinc-600 bg-zinc-900/50 border border-zinc-800/50 hover:text-rose-400/50 cursor-not-allowed'
                  }`} 
                  title={userRole === 'admin' ? "Reset Engine" : "Reset Locked (Admin Only)"}
                >
                  {userRole === 'admin' ? <Trash2 size={18}/> : <Lock size={18}/>}
                </button>
              )}
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
            
            {/* ✨ NEW LOGOUT BUTTON */}
            <button onClick={handleLogout} className="text-zinc-500 hover:text-rose-400 transition-colors" title="Logout Session">
              <LogOut size={18} />
            </button>
            
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
                    
                    {/* ✨ UPGRADED EXPORT BUTTON & RICH DROPDOWN */}
                    <div className="relative z-50" onMouseEnter={() => setIsExportHovered(true)} onMouseLeave={() => setIsExportHovered(false)}>
                      <button className="group relative inline-flex items-center justify-center gap-2 bg-zinc-900/80 backdrop-blur-md text-white border border-zinc-700/50 hover:border-indigo-500/50 px-5 py-2.5 rounded-lg text-sm font-bold tracking-wide transition-all shadow-xl overflow-hidden">
                        {/* Shimmer Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/10 to-indigo-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                        
                        <Download size={16} className="text-indigo-400 group-hover:-translate-y-0.5 transition-transform" />
                        <span>Export Report</span>
                        <ChevronDown size={14} className="text-zinc-500 group-hover:text-zinc-300 ml-1 transition-colors" />
                      </button>
                      
                      <AnimatePresence>
                        {isExportHovered && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }} 
                            animate={{ opacity: 1, y: 0, scale: 1 }} 
                            exit={{ opacity: 0, y: 10, scale: 0.95 }} 
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="absolute right-0 mt-2 w-72 bg-zinc-900/90 backdrop-blur-xl border border-zinc-700/50 rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.4)] overflow-hidden"
                          >
                            <div className="p-2 space-y-1">
                              <div className="px-3 py-2 border-b border-zinc-800/60 mb-1">
                                <p className="text-[10px] font-black tracking-widest text-zinc-500 uppercase">Generate Audit Artifacts</p>
                              </div>

                              <button onClick={() => downloadReport('all')} className="w-full p-3 text-left rounded-lg hover:bg-indigo-500/10 group transition-all flex items-start gap-3">
                                <div className="bg-zinc-800 group-hover:bg-indigo-500/20 p-2 rounded-md transition-colors"><FileText size={16} className="text-zinc-400 group-hover:text-indigo-400"/></div>
                                <div><p className="text-sm font-bold text-zinc-200 group-hover:text-indigo-300">Executive Summary</p><p className="text-[10px] text-zinc-500 mt-0.5">High-level risk overview for stakeholders</p></div>
                              </button>

                              <button onClick={() => downloadReport('sast')} className="w-full p-3 text-left rounded-lg hover:bg-indigo-500/10 group transition-all flex items-start gap-3">
                                <div className="bg-zinc-800 group-hover:bg-indigo-500/20 p-2 rounded-md transition-colors"><Code2 size={16} className="text-zinc-400 group-hover:text-indigo-400"/></div>
                                <div><p className="text-sm font-bold text-zinc-200 group-hover:text-indigo-300">SAST Code Report</p><p className="text-[10px] text-zinc-500 mt-0.5">Static analysis & hardcoded secret findings</p></div>
                              </button>

                              <button onClick={() => downloadReport('dast')} className="w-full p-3 text-left rounded-lg hover:bg-violet-500/10 group transition-all flex items-start gap-3">
                                <div className="bg-zinc-800 group-hover:bg-violet-500/20 p-2 rounded-md transition-colors"><Globe size={16} className="text-zinc-400 group-hover:text-violet-400"/></div>
                                <div><p className="text-sm font-bold text-zinc-200 group-hover:text-violet-300">DAST Web Report</p><p className="text-[10px] text-zinc-500 mt-0.5">Dynamic payload results & network vulnerabilities</p></div>
                              </button>

                              <div className="border-t border-zinc-800/60 my-1"></div>

                              <button onClick={() => downloadReport('container')} className="w-full p-3 text-left rounded-lg hover:bg-cyan-500/10 group transition-all flex items-start gap-3">
                                <div className="bg-zinc-800 group-hover:bg-cyan-500/20 p-2 rounded-md transition-colors"><Server size={16} className="text-zinc-400 group-hover:text-cyan-400"/></div>
                                <div><p className="text-sm font-bold text-zinc-200 group-hover:text-cyan-300">Container Report</p><p className="text-[10px] text-zinc-500 mt-0.5">Image layer CVEs & Dockerfile misconfigs</p></div>
                              </button>

                              <button onClick={() => downloadReport('db')} className="w-full p-3 text-left rounded-lg hover:bg-emerald-500/10 group transition-all flex items-start gap-3">
                                <div className="bg-zinc-800 group-hover:bg-emerald-500/20 p-2 rounded-md transition-colors"><Database size={16} className="text-zinc-400 group-hover:text-emerald-400"/></div>
                                <div><p className="text-sm font-bold text-zinc-200 group-hover:text-emerald-300">Database Report</p><p className="text-[10px] text-zinc-500 mt-0.5">Infrastructure access & policy audit</p></div>
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* ✨ UPGRADED KPI CARDS WITH HOVER GLOWS & TRENDS */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8 relative z-20">
                    
                    <div className="group bg-gradient-to-br from-rose-500/10 to-zinc-900/80 backdrop-blur-xl border border-rose-500/20 p-5 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(244,63,94,0.15)] overflow-hidden relative">
                      <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-all"></div>
                      <div className="flex items-center justify-between mb-2 relative z-10"><p className="text-[10px] font-black tracking-widest text-rose-500/80 uppercase">Total Threats</p><AlertTriangle size={14} className="text-rose-500/50"/></div>
                      <p className="text-4xl font-black text-rose-100 relative z-10 tracking-tighter">{totalIssues}</p>
                      <div className={`mt-3 flex items-center gap-1.5 text-[10px] font-bold w-max px-2 py-1 rounded border relative z-10 ${totalTrend.color === 'rose' ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' : totalTrend.color === 'emerald' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : totalTrend.color === 'amber' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 'text-zinc-400 bg-zinc-800 border-zinc-700'}`}>
                        <totalTrend.icon size={10}/> {totalTrend.text}
                      </div>
                    </div>
                    
                    <div className="group bg-gradient-to-br from-indigo-500/10 to-zinc-900/80 backdrop-blur-xl border border-indigo-500/20 p-5 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(99,102,241,0.15)] overflow-hidden relative">
                      <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all"></div>
                      <div className="flex items-center justify-between mb-2 relative z-10"><p className="text-[10px] font-black tracking-widest text-indigo-400/80 uppercase">Codebase (SAST)</p><Code2 size={14} className="text-indigo-400/50"/></div>
                      <p className="text-4xl font-black text-indigo-100 relative z-10 tracking-tighter">{activeGithub.length}</p>
                      <div className={`mt-3 flex items-center gap-1.5 text-[10px] font-bold w-max px-2 py-1 rounded border relative z-10 ${sastTrend.color === 'rose' ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' : sastTrend.color === 'emerald' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : sastTrend.color === 'amber' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 'text-zinc-400 bg-zinc-800 border-zinc-700'}`}>
                        <sastTrend.icon size={10}/> {sastTrend.text}
                      </div>
                    </div>

                    <div className="group bg-gradient-to-br from-violet-500/10 to-zinc-900/80 backdrop-blur-xl border border-violet-500/20 p-5 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(139,92,246,0.15)] overflow-hidden relative">
                      <div className="absolute -right-4 -top-4 w-24 h-24 bg-violet-500/10 rounded-full blur-2xl group-hover:bg-violet-500/20 transition-all"></div>
                      <div className="flex items-center justify-between mb-2 relative z-10"><p className="text-[10px] font-black tracking-widest text-violet-400/80 uppercase">Runtime (DAST)</p><Globe size={14} className="text-violet-400/50"/></div>
                      <p className="text-4xl font-black text-violet-100 relative z-10 tracking-tighter">{activeWeb.length}</p>
                      <div className={`mt-3 flex items-center gap-1.5 text-[10px] font-bold w-max px-2 py-1 rounded border relative z-10 ${dastTrend.color === 'rose' ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' : dastTrend.color === 'emerald' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : dastTrend.color === 'amber' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 'text-zinc-400 bg-zinc-800 border-zinc-700'}`}>
                        <dastTrend.icon size={10}/> {dastTrend.text}
                      </div>
                    </div>

                    <div className="group bg-gradient-to-br from-cyan-500/10 to-zinc-900/80 backdrop-blur-xl border border-cyan-500/20 p-5 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(6,182,212,0.15)] overflow-hidden relative">
                      <div className="absolute -right-4 -top-4 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all"></div>
                      <div className="flex items-center justify-between mb-2 relative z-10"><p className="text-[10px] font-black tracking-widest text-cyan-400/80 uppercase">Containers</p><Server size={14} className="text-cyan-400/50"/></div>
                      <p className="text-4xl font-black text-cyan-100 relative z-10 tracking-tighter">{activeContainer.length}</p>
                      <div className={`mt-3 flex items-center gap-1.5 text-[10px] font-bold w-max px-2 py-1 rounded border relative z-10 ${containerTrend.color === 'rose' ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' : containerTrend.color === 'emerald' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : containerTrend.color === 'amber' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 'text-zinc-400 bg-zinc-800 border-zinc-700'}`}>
                        <containerTrend.icon size={10}/> {containerTrend.text}
                      </div>
                    </div>

                    <div className="group bg-gradient-to-br from-emerald-500/10 to-zinc-900/80 backdrop-blur-xl border border-emerald-500/20 p-5 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(16,185,129,0.15)] overflow-hidden relative">
                      <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
                      <div className="flex items-center justify-between mb-2 relative z-10"><p className="text-[10px] font-black tracking-widest text-emerald-400/80 uppercase">Databases</p><Database size={14} className="text-emerald-400/50"/></div>
                      <p className="text-4xl font-black text-emerald-100 relative z-10 tracking-tighter">{activeDb.length}</p>
                      <div className={`mt-3 flex items-center gap-1.5 text-[10px] font-bold w-max px-2 py-1 rounded border relative z-10 ${dbTrend.color === 'rose' ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' : dbTrend.color === 'emerald' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : dbTrend.color === 'amber' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 'text-zinc-400 bg-zinc-800 border-zinc-700'}`}>
                        <dbTrend.icon size={10}/> {dbTrend.text}
                      </div>
                    </div>
                  </div>

                  {/* ✨ UPGRADED SOC DASHBOARD ROW */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-20 mb-8">
                    
                    {/* 1. The Glowing Doughnut Chart */}
                    <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-6 flex flex-col h-[380px] shadow-xl relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-indigo-900/5 pointer-events-none"></div>
                      <h3 className="text-xs font-black tracking-widest text-zinc-300 mb-6 uppercase flex items-center gap-2"><Activity size={14} className="text-indigo-500"/> Global Severity Spread</h3>
                      
                      <div className="flex-1 relative">
                        {globalSeverityData.length > 0 ? (
                          <>
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie 
                                  data={globalSeverityData} 
                                  innerRadius="65%" 
                                  outerRadius="90%" 
                                  paddingAngle={4} 
                                  dataKey="value"
                                  stroke="none"
                                >
                                  {globalSeverityData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} style={{ filter: `drop-shadow(0px 0px 8px ${entry.color}40)` }} />
                                  ))}
                                </Pie>
                                <Tooltip 
                                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px', padding: '12px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }} 
                                  itemStyle={{ color: '#e4e4e7', fontSize: '13px', fontWeight: 'bold' }} 
                                />
                              </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                              <span className="text-4xl font-black text-white tracking-tighter">{totalIssues}</span>
                              <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mt-1">Total Found</span>
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600">
                            <ShieldCheck size={40} className="mb-3 opacity-20" />
                            <span className="text-xs font-bold uppercase tracking-widest">Zero Threats Detected</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 2. The Live Threat Feed (Takes up 2 columns) */}
                    <div className="lg:col-span-2 bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-6 flex flex-col h-[380px] shadow-xl">
                      <div className="flex items-center justify-between mb-6 border-b border-zinc-800/60 pb-4">
                        <h3 className="text-xs font-black tracking-widest text-zinc-300 uppercase flex items-center gap-2">
                          <TerminalSquare size={14} className="text-rose-500"/> Live Threat Telemetry
                        </h3>
                        <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest bg-rose-500/10 text-rose-500 border border-rose-500/20 px-2 py-1 rounded shadow-[0_0_10px_rgba(244,63,94,0.2)]">
                          <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping mr-1"></span> Live Monitoring
                        </span>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto pr-2 space-y-2.5 custom-scrollbar">
                        {allActiveFindings.length === 0 ? (
                           <div className="h-full flex items-center justify-center text-zinc-600 text-sm font-mono">
                             > Awaiting incoming telemetry payload...
                           </div>
                        ) : (
                          allActiveFindings.slice(0, 15).map((f, i) => (
                            <div key={i} className="flex items-start gap-4 p-3 bg-zinc-950/50 hover:bg-zinc-800/50 border border-zinc-800/50 rounded-lg transition-colors group">
                              <span className={`mt-0.5 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded border flex-shrink-0 w-20 text-center ${f.Severity === 'Critical' || f.Severity === 'High' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : f.Severity === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                                {f.Severity}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-zinc-200 font-mono truncate group-hover:text-indigo-300 transition-colors">{f.Issue}</p>
                                <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1 truncate">{f.Type} | <span className="text-zinc-600">Engine: NexusSec Core</span></p>
                              </div>
                              <span className="text-[10px] text-zinc-600 font-mono whitespace-nowrap">Just Now</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 bg-zinc-900/60 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-6 shadow-xl relative z-20">
              <div className="flex items-center justify-between mb-6 border-b border-zinc-800/60 pb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-500/10 p-2 rounded-lg">
                    <CheckCircle size={18} className="text-emerald-500"/>
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-zinc-200 uppercase tracking-widest">Remediation History</h3>
                    <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Verified resolutions across all security modules.</p>
                  </div>
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-1 rounded shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                  Compliance Validated
                </span>
              </div>

              <div className="max-h-80 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                {resolvedFindings.length === 0 ? (
                  <div className="h-32 flex flex-col items-center justify-center text-zinc-700 border border-dashed border-zinc-800 rounded-xl">
                    <ShieldCheck size={24} className="mb-2 opacity-20" />
                    <span className="text-[10px] uppercase font-bold tracking-widest">No verified remediations yet.</span>
                  </div>
                ) : (
                  resolvedFindings.map((f, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl group hover:border-emerald-500/30 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center">
                          <div className="p-2 bg-emerald-500/20 rounded-full mb-1">
                            <ShieldCheck size={14} className="text-emerald-400" />
                          </div>
                          <span className="text-[7px] text-emerald-600 font-black uppercase">Fixed</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-emerald-100 font-mono">{f.Issue}</p>
                            <span className="text-[8px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-700 font-bold uppercase">
                              {f.origin}
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-500 mt-1">
                            Resolved in: <span className="text-zinc-400 font-mono">{f.File || 'Infrastructure'}</span> • Verified by: <span className="text-indigo-400 font-bold uppercase">{f.resolvedBy}</span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-emerald-500/70 font-mono font-bold">{f.resolvedAt}</p>
                        <div className="mt-1 flex items-center gap-1 justify-end">
                          <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></div>
                          <p className="text-[8px] text-zinc-500 uppercase font-black tracking-tighter italic">Ledger Entry #{i + 1001}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8 ">
                    {renderChart('SAST Code Distribution', <Code2 className="text-indigo-400" size={16}/>, githubChartData)}
                    {renderChart('DAST Web Vulnerabilities', <Globe className="text-violet-400" size={16}/>, webChartData)}
                    {renderChart('Container CVEs', <Server className="text-cyan-400" size={16}/>, containerChartData)}
                    {renderChart('Infrastructure Configs', <Database className="text-emerald-400" size={16}/>, dbChartData)}
                  </div>
                </motion.div>
              )}

              {/* ✨ NEW COMPLIANCE & GRC PAGE */}
              {activeTab === 'Compliance & GRC' && (
                <motion.div key="grc" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className={`relative ${userRole === 'developer' ? 'h-[80vh] overflow-hidden' : 'min-h-[80vh]'}`}>
                  {/* ✨ RBAC: GRC LOCKED FOR DEVELOPERS */}
                  {userRole === 'developer' && (
                    <div className="absolute inset-0 z-[999] backdrop-blur-md bg-[#09090b]/60 rounded-xl flex flex-col items-center justify-center text-center border border-rose-500/20 shadow-2xl overflow-hidden">
                      <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(244,63,94,0.05)_10px,rgba(244,63,94,0.05)_20px)] pointer-events-none" />
                      <div className="bg-rose-500/10 p-5 rounded-full mb-6 relative z-10 border border-rose-500/20">
                         <div className="absolute inset-0 bg-rose-500/20 rounded-full animate-ping opacity-50"></div>
                         <Lock size={40} className="text-rose-500 relative z-10" />
                      </div>
                      <h3 className="text-2xl font-black text-white uppercase tracking-widest mb-3 relative z-10">Clearance Required</h3>
                      <p className="text-zinc-300 text-sm max-w-md mb-8 leading-relaxed relative z-10">
                        Your <strong className="text-rose-400">Developer</strong> profile is restricted from viewing production governance metrics to enforce strict Separation of Duties (SoD).
                      </p>
                      <button onClick={() => setActiveTab('Dashboard')} className="bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 text-white px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 shadow-xl relative z-10"><ChevronLeft size={16} /> Return to Dashboard</button>
                    </div>
                  )}
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 relative z-30">
                    <div>
                      <h2 className="text-2xl font-bold text-white tracking-tight">Governance, Risk & Compliance</h2>
                      <p className="text-sm text-zinc-500 mt-1">Translating technical vulnerabilities into business risk and audit readiness.</p>
                    </div>
                  </div>

                  {/* ✨ AUDITOR ONLY: TOGGLEABLE LEDGER ✨ */}
                  {userRole === 'auditor' && (
                    <div className="mb-8 relative z-20">
                      <button
                        onClick={() => setShowLedger(!showLedger)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all border ${showLedger ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 shadow-lg'}`}
                      >
                        <BookOpen size={16} />
                        {showLedger ? 'Close Compliance Ledger' : 'View Compliance Ledger'}
                      </button>

                      <AnimatePresence>
                        {showLedger && (
                          <motion.div
                            initial={{ opacity: 0, height: 0, marginTop: 0 }}
                            animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                            exit={{ opacity: 0, height: 0, marginTop: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="bg-zinc-900/60 backdrop-blur-xl border border-indigo-500/20 rounded-2xl p-6 shadow-xl relative">
                              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-indigo-900/5 pointer-events-none rounded-2xl"></div>
                              <div className="flex items-center gap-3 mb-6 border-b border-zinc-800/60 pb-4 relative z-10">
                                <div className="bg-indigo-500/10 p-2 rounded-lg border border-indigo-500/20">
                                  <BookOpen size={20} className="text-indigo-400" />
                                </div>
                                <div>
                                  <h3 className="text-sm font-black text-zinc-200 uppercase tracking-widest flex items-center gap-2">
                                    Immutable Compliance Ledger <ShieldCheck size={14} className="text-emerald-500"/>
                                  </h3>
                                  <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Cryptographically secure audit trail of all platform authorizations.</p>
                                </div>
                              </div>

                              <div className="bg-[#050505] rounded-xl border border-zinc-800/80 overflow-hidden relative z-10 max-h-[300px] overflow-y-auto custom-scrollbar">
                                {auditTrail.length === 0 ? (
                                  <div className="p-8 text-center text-zinc-600 text-xs font-mono">No compliance events recorded yet.</div>
                                ) : (
                                  <table className="w-full text-left border-collapse">
                                    <thead className="bg-zinc-900/80 text-[9px] uppercase tracking-widest text-zinc-500 border-b border-zinc-800">
                                      <tr>
                                        <th className="p-4 font-bold">Timestamp</th>
                                        <th className="p-4 font-bold">Actor</th>
                                        <th className="p-4 font-bold">Action</th>
                                        <th className="p-4 font-bold">Target Asset / CVE</th>
                                      </tr>
                                    </thead>
                                    <tbody className="text-xs font-mono text-zinc-300">
                                      {auditTrail.map((entry) => (
                                        <tr key={entry.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
                                          <td className="p-4 text-zinc-500">{entry.timestamp}</td>
                                          <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest border ${entry.actor === 'admin' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                                              {entry.actor}
                                            </span>
                                          </td>
                                          <td className="p-4">
                                            <span className={`${entry.action.includes('APPROVED') ? 'text-emerald-400' : entry.action.includes('DENIED') ? 'text-rose-400' : 'text-amber-400'} font-bold`}>
                                              {entry.action}
                                            </span>
                                          </td>
                                          <td className="p-4 truncate max-w-[200px] text-zinc-400">{entry.target}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Top KPI Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 relative z-[100]">
                    
                    {/* CARD 1: GLOBAL HEALTH SCORE */}
                    <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800 p-5 rounded-xl flex items-center justify-between relative hover:z-[100] transition-all">
                      <div>
                        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-1">Global Health Score</p>
                        <p className={`text-3xl font-bold ${averageScore > 80 ? 'text-emerald-400' : averageScore > 50 ? 'text-amber-400' : 'text-rose-400'}`}>{averageScore}<span className="text-lg text-zinc-600">/100</span></p>
                      </div>
                      
                      <div className={`relative group p-3 rounded-full cursor-help transition-colors ${averageScore > 80 ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20' : averageScore > 50 ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20' : 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20'}`}>
                        <Scale size={24} />
                        
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-64 p-3 bg-zinc-950 border border-zinc-700 rounded-lg shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[999]">
                          <h4 className="text-xs font-bold text-zinc-200 mb-1 border-b border-zinc-800 pb-1">Calculation Metrics</h4>
                          <p className="text-[10px] text-zinc-400 mb-2 leading-relaxed">Score begins at 100 per framework. Points are deducted based on active threat severity mapped to specific compliance controls:</p>
                          <div className="text-[10px] font-mono text-zinc-500 flex flex-col gap-0.5">
                            <span className="flex justify-between"><span>Critical:</span> <span className="text-rose-400">-20 pts</span></span>
                            <span className="flex justify-between"><span>High:</span> <span className="text-orange-400">-12 pts</span></span>
                            <span className="flex justify-between"><span>Medium:</span> <span className="text-amber-400">-5 pts</span></span>
                            <span className="flex justify-between"><span>Low:</span> <span className="text-blue-400">-1 pt</span></span>
                          </div>
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-px border-4 border-transparent border-b-zinc-700" />
                        </div>
                      </div>
                    </div>

                    {/* CARD 2: STATIC AUDIT BLOCKERS */}
                    <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800 p-5 rounded-xl flex items-center justify-between relative hover:z-[100] transition-all">
                      <div>
                        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-1">Audit Blockers</p>
                        <p className="text-3xl font-bold text-white flex items-center gap-3">
                          {criticalBlockers} 
                          <span className="text-sm font-medium text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded uppercase tracking-wider border border-rose-500/20">Critical</span>
                        </p>
                      </div>
                      <div className="p-4 rounded-full bg-indigo-500/10 text-indigo-400 shadow-inner">
                        <ShieldCheck size={28} />
                      </div>
                    </div>

                    {/* CARD 3: MANUAL REMEDIATION TIME */}
                    <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800 p-5 rounded-xl flex items-center justify-between relative group hover:z-[100] transition-all">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Manual Remediation Time</p>
                          <Info size={14} className="text-zinc-500 cursor-help hover:text-indigo-400 transition-colors" />
                        </div>
                        
                        <p className="text-3xl font-bold text-indigo-100">
                          {totalEngineeringHours} <span className="text-lg text-zinc-500 font-medium">hrs</span>
                        </p>
                      </div>
                      
                      <div className="p-3 rounded-full bg-indigo-500/10 text-indigo-400">
                        <Clock size={24} />
                      </div>

                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-72 p-4 bg-zinc-950 border border-indigo-500/30 rounded-lg shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[999]">
                        <h4 className="text-xs font-bold text-indigo-400 mb-2 flex items-center gap-1.5"><Sparkles size={12}/> Optimization & Best Practices</h4>
                        <ul className="text-[10px] text-zinc-400 space-y-1.5 list-disc pl-3 leading-relaxed">
                          <li><strong className="text-zinc-300">Neural Auto-Fix:</strong> Utilize NexusSec AI to generate remediation code, reducing engineering hours by ~95%.</li>
                          <li><strong className="text-zinc-300">CI/CD Patching:</strong> Automate minor OS/Container package updates via dependabot or Trivy hooks.</li>
                        </ul>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-px border-4 border-transparent border-b-indigo-500/30" />
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

                    {/* Dynamic Threat / Business Translation List */}
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
                            
                            // ✨ NEW LOGIC: Identify which scanner found this bug
                            let sourceTab = 'Dashboard';
                            let sourceLabel = 'Unknown';
                            if (activeGithub.some(f => f.Issue === finding.Issue)) { sourceTab = 'Source Audit'; sourceLabel = 'SAST Engine'; }
                            else if (activeWeb.some(f => f.Issue === finding.Issue)) { sourceTab = 'Penetration Test'; sourceLabel = 'DAST Engine'; }
                            else if (activeContainer.some(f => f.Issue === finding.Issue)) { sourceTab = 'Container Security'; sourceLabel = 'Container Ops'; }
                            else if (activeDb.some(f => f.Issue === finding.Issue)) { sourceTab = 'Database Security'; sourceLabel = 'DB Audit'; }

                            // 1. Framework Logic
                            let framework = "OWASP Top 10";
                            let frameworkColor = "text-blue-400 bg-blue-500/10 border-blue-500/20";
                            if (issueLower.includes('secret') || issueLower.includes('token') || issueLower.includes('api')) {
                              framework = "SOC 2 (CC6.1)";
                              frameworkColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
                            } else if (issueLower.includes('config') || issueLower.includes('cve') || issueLower.includes('debug') || issueLower.includes('root')) {
                              framework = "ISO 27001 (A.12)";
                              frameworkColor = "text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20";
                            } else if (issueLower.includes('crypto') || issueLower.includes('hash')) {
                              framework = "PCI-DSS (Req 4)";
                              frameworkColor = "text-amber-400 bg-amber-500/10 border-amber-500/20";
                            }

                            // 2. Business Impact Translation Logic
                            let businessImpact = "General Security & Compliance Risk";
                            if (issueLower.includes('secret') || issueLower.includes('token') || issueLower.includes('api')) {
                              businessImpact = "Severe Credential & Infrastructure Compromise";
                            } else if (issueLower.includes('injection') || issueLower.includes('sql')) {
                              businessImpact = "Customer Database Breach & Data Exfiltration";
                            } else if (issueLower.includes('xss')) {
                              businessImpact = "Client-Side Session Hijacking & Phishing";
                            } else if (issueLower.includes('crypto') || issueLower.includes('hash')) {
                              businessImpact = "Data-at-Rest Decryption Vulnerability";
                            } else if (issueLower.includes('cve')) {
                              businessImpact = "Unpatched Zero-Day Exploit Susceptibility";
                            } else if (issueLower.includes('root') || issueLower.includes('privilege')) {
                              businessImpact = "Complete Containerized Environment Takeover";
                            } else if (issueLower.includes('access') || issueLower.includes('admin')) {
                              businessImpact = "Unauthorized Administrative Access";
                            }

                            // 3. Risk Description Logic
                            let riskDesc = "";
                            if (issueLower.includes('secret') || issueLower.includes('token') || issueLower.includes('api')) {
                              riskDesc = "Unencrypted credentials detected. Violates confidentiality and secure asset management controls.";
                            } else if (issueLower.includes('injection') || issueLower.includes('sql') || issueLower.includes('xss')) {
                              riskDesc = "Missing input sanitization allows unauthorized database or client access. Violates data integrity guidelines.";
                            } else if (issueLower.includes('crypto') || issueLower.includes('hash')) {
                              riskDesc = "Weak cryptographic protocols detected. Violates data-at-rest encryption requirements.";
                            } else {
                              riskDesc = finding.Fix ? `Remediation required to pass audit: ${finding.Fix}` : "Fails baseline security and patch management compliance controls.";
                            }

                            return (
                              <div key={idx} className="p-4 bg-zinc-950/80 border border-zinc-800 rounded-xl flex flex-col gap-2 hover:border-zinc-700 transition-colors shadow-sm">
                                <div className="flex justify-between items-start mb-1">
                                  <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-widest rounded border ${frameworkColor}`}>
                                    Violates: {framework}
                                  </span>
                                  <span className={`text-[10px] font-black tracking-widest uppercase ${finding.Severity === 'Critical' ? 'text-rose-500' : finding.Severity === 'High' ? 'text-orange-500' : 'text-zinc-500'}`}>
                                    {finding.Severity}
                                  </span>
                                </div>
                                
                                <p className="text-sm text-zinc-100 font-bold tracking-tight">{businessImpact}</p>
                                
                                {/* ✨ UPGRADED ISSUE ROW WITH ADMIN REDIRECT BUTTON ✨ */}
                                <div className="flex items-center justify-between gap-3 mt-1">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <Code2 size={12} className="text-zinc-600 shrink-0" />
                                    <p className="text-[10px] text-zinc-500 font-mono truncate" title={finding.Issue}>{finding.Issue}</p>
                                  </div>
                                  
                                  {/* Render Button ONLY if user is Admin */}
                                  {userRole === 'admin' && (
                                    <button
                                      onClick={() => setActiveTab(sourceTab)}
                                      className="shrink-0 flex items-center gap-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2 py-1.5 rounded text-[8px] font-black uppercase tracking-widest transition-all shadow-sm group"
                                      title={`Investigate in ${sourceTab}`}
                                    >
                                      {sourceLabel} <ChevronRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                                    </button>
                                  )}
                                </div>
                                
                                <p className="text-xs text-zinc-400 line-clamp-2 mt-2 leading-relaxed bg-zinc-900/50 p-2 rounded border border-zinc-800/50">
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
                <motion.div key="source" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className={`relative ${userRole === 'auditor' ? 'h-[80vh] overflow-hidden' : 'min-h-[80vh]'}`}>
                  {/* ✨ RBAC: ENTIRE PAGE LOCKED FOR AUDITORS ✨ */}
                  {userRole === 'auditor' && (
                    <div className="absolute inset-0 z-[999] backdrop-blur-md bg-[#09090b]/60 rounded-xl flex flex-col items-center justify-center text-center border border-indigo-500/20 shadow-2xl overflow-hidden">
                      <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(99,102,241,0.05)_10px,rgba(99,102,241,0.05)_20px)] pointer-events-none" />
                      <div className="bg-indigo-500/10 p-5 rounded-full mb-6 relative z-10 border border-indigo-500/20">
                         <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping opacity-50"></div>
                         <ShieldCheck size={40} className="text-indigo-500 relative z-10" />
                      </div>
                      <h3 className="text-2xl font-black text-white uppercase tracking-widest mb-3 relative z-10">Clearance Required</h3>
                      <p className="text-zinc-300 text-sm max-w-md mb-8 leading-relaxed relative z-10">
                        Your <strong className="text-indigo-400">Auditor</strong> profile restricts access to active scanning execution and raw source code environments. Please review aggregated risk metrics on the Dashboard.
                      </p>
                      <button onClick={() => setActiveTab('Dashboard')} className="bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 text-white px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 shadow-xl relative z-10"><ChevronLeft size={16} /> Return to Dashboard</button>
                    </div>
                  )}
                  <div className="mb-8 relative z-20"><h2 className="text-2xl font-bold text-white tracking-tight">Static Application Security Testing</h2><p className="text-sm text-zinc-500 mt-1">Scan source code repositories for secrets and vulnerabilities.</p></div>
                  {!githubToken ? (
                    <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800 border-dashed rounded-xl p-12 flex flex-col items-center justify-center text-center relative z-20">
                      <div className="bg-zinc-800 p-4 rounded-full mb-6"><Github size={32} className="text-white" /></div><h3 className="text-lg font-semibold text-white mb-2">Connect to GitHub</h3><p className="text-zinc-500 text-sm max-w-md mb-8">Authorize NexusSec to access your repositories for automated scanning.</p>
                      <a href={`https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=repo%20user&redirect_uri=http://localhost:3000`} className="inline-flex items-center justify-center gap-2 bg-white text-black hover:bg-zinc-200 px-6 py-2.5 rounded-md text-sm font-bold transition-all w-full max-w-xs mb-8"><Github size={18}/> Authenticate</a>
                      <div className="w-full max-w-xl border-t border-zinc-800 pt-8 flex flex-col gap-3">
                        <div className="flex gap-3">
                          <div className="relative flex-1"><Code2 className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16}/><input type="text" value={repo} onChange={(e) => setRepo(e.target.value)} placeholder="Or paste public repo URL..." className="w-full bg-[#09090b] border border-zinc-800 rounded-md py-2 pl-10 pr-4 text-sm text-zinc-200 outline-none transition-all" /></div>
                          <button onClick={() => runScan('github', 'github', { repo })} disabled={scanState.isActive || userRole === 'auditor'} className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-md text-sm font-medium transition-all disabled:opacity-50">{scanState.isActive && scanState.type === 'github' ? <Activity size={16} className="animate-spin" /> : "Run Scan"}</button>
                        </div>
                        {renderProgressBar('github')}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800 rounded-xl p-6 flex flex-col gap-4 relative z-20 overflow-hidden">
                      {/* ✨ CARD BLOCK: AUDITOR READ-ONLY */}
                      {userRole === 'auditor' && (
                        <div className="absolute inset-0 z-[100] backdrop-blur-md bg-[#09090b]/80 flex flex-col items-center justify-center text-center border border-indigo-500/20">
                          <ShieldCheck size={32} className="text-indigo-500 mb-2" />
                          <h3 className="text-base font-black text-white uppercase tracking-widest mb-1">Execution Locked</h3>
                          <p className="text-zinc-400 text-[10px] uppercase tracking-widest">Read-Only Auditor Profile</p>
                        </div>
                      )}

                      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                        <div className="flex items-center gap-4"><div className="bg-indigo-500/20 p-2.5 rounded-lg"><Github className="text-indigo-400" size={20}/></div><div><p className="text-white text-sm font-semibold">GitHub Connected</p><p className="text-zinc-500 text-xs">{userRepos.length} Repositories sync'd</p></div></div>
                        <button onClick={handleGithubLogout} className="p-2 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors"><LogOut size={16}/></button>
                      </div>
                      <div className="flex flex-col gap-3">
                        <div className="flex gap-3">
                          <select value={repo} onChange={(e) => setRepo(e.target.value)} className="flex-1 bg-[#09090b] border border-zinc-800 rounded-md py-2 px-3 text-sm text-zinc-200 outline-none">{userRepos.map((r, i) => <option key={i} value={r}>{r}</option>)}</select>
                          <button onClick={() => runScan('github', 'github', { repo, token: githubToken })} disabled={scanState.isActive || userRole === 'auditor'} className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap disabled:opacity-50">Run SAST</button>
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
                <motion.div key="web" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className={`relative ${(!dastWarningAccepted || userRole === 'auditor') ? 'h-[80vh] overflow-hidden' : 'min-h-[80vh]'}`}>
                  {/* ✨ RBAC: ENTIRE PAGE LOCKED FOR AUDITORS ✨ */}
                  {userRole === 'auditor' && (
                    <div className="absolute inset-0 z-[999] backdrop-blur-md bg-[#09090b]/60 rounded-xl flex flex-col items-center justify-center text-center border border-indigo-500/20 shadow-2xl overflow-hidden">
                      <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(99,102,241,0.05)_10px,rgba(99,102,241,0.05)_20px)] pointer-events-none" />
                      <div className="bg-indigo-500/10 p-5 rounded-full mb-6 relative z-10 border border-indigo-500/20">
                         <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping opacity-50"></div>
                         <ShieldCheck size={40} className="text-indigo-500 relative z-10" />
                      </div>
                      <h3 className="text-2xl font-black text-white uppercase tracking-widest mb-3 relative z-10">Clearance Required</h3>
                      <p className="text-zinc-300 text-sm max-w-md mb-8 leading-relaxed relative z-10">
                        Your <strong className="text-indigo-400">Auditor</strong> profile restricts access to active scanning execution and raw source code environments. Please review aggregated risk metrics on the Dashboard.
                      </p>
                      <button onClick={() => setActiveTab('Dashboard')} className="bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 text-white px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 shadow-xl relative z-10"><ChevronLeft size={16} /> Return to Dashboard</button>
                    </div>
                  )}
                  
                  {/* ✨ THE ETHICAL USE LOCK SCREEN MODAL */}
                  <AnimatePresence>
                    {!dastWarningAccepted && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }} 
                        animate={{ opacity: 1, scale: 1 }} 
                        exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }} 
                        className="absolute inset-0 z-[9999] flex items-center justify-center p-4"
                      >
                        <div className="bg-zinc-900/95 backdrop-blur-xl border border-rose-500/50 p-8 rounded-2xl max-w-lg w-full shadow-2xl shadow-rose-900/20 text-center relative overflow-hidden">
                          <div className="absolute inset-0 opacity-5 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#f43f5e_10px,#f43f5e_20px)] pointer-events-none" />
                          
                          <div className="bg-rose-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 relative z-10 border border-rose-500/20">
                            <AlertTriangle size={32} className="text-rose-500" />
                          </div>
                          
                          <h2 className="text-2xl font-bold text-white mb-4 uppercase tracking-wide relative z-10">Caution: Live Payloads</h2>
                          
                          <p className="text-sm text-zinc-400 mb-6 leading-relaxed relative z-10">
                            NexusSec contains active Dynamic Application Security Testing (DAST) engines. By proceeding, you confirm that you have <strong className="text-rose-400">explicit, written authorization</strong> to run vulnerability scans against the target environment.
                          </p>
                          
                          <div className="bg-zinc-950/80 p-4 rounded-lg border border-zinc-800/80 mb-8 text-left relative z-10">
                            <ul className="text-[11px] text-zinc-500 space-y-2 list-disc pl-4 font-mono uppercase tracking-wider">
                              <li>Unauthorized scanning is illegal.</li>
                              <li>Payloads may alter target data.</li>
                              <li>The developer assumes zero liability.</li>
                            </ul>
                          </div>

                          <button
                            onClick={handleAcceptDastWarning}
                            disabled={dastWarningCountdown > 0}
                            className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest transition-all duration-300 relative z-10 ${
                              dastWarningCountdown > 0 
                                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700' 
                                : 'bg-rose-600 text-white hover:bg-rose-500 shadow-[0_0_20px_rgba(225,29,72,0.4)] border border-rose-500'
                            }`}
                          >
                            {dastWarningCountdown > 0 
                              ? `Please Read (${dastWarningCountdown}s)` 
                              : 'I Understand & Agree'
                            }
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* 🔒 WRAPPER */}
                  <div className={`transition-all duration-700 ${!dastWarningAccepted ? 'opacity-20 blur-md pointer-events-none select-none' : ''}`}>
                    
                    <div className="mb-6 relative z-20 flex flex-col md:flex-row md:items-end justify-between gap-4">
                      <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                          <Zap size={24} className="text-cyan-400" /> Dynamic Application Security Testing
                        </h2>
                        <p className="text-sm text-zinc-500 mt-1 font-mono uppercase tracking-widest">Powered by OWASP ZAP 2.17.0 </p>
                      </div>
                    </div>

                    <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800 rounded-xl p-6 relative z-20 overflow-hidden shadow-[0_0_30px_rgba(6,182,212,0.05)]">
                    
                      <div className="relative mb-6">
                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-500" size={18}/>
                        <input 
                          type="text" 
                          value={targetUrl} 
                          onChange={(e) => setTargetUrl(e.target.value)} 
                          className="w-full h-full bg-[#050505] border border-zinc-800 rounded-lg py-4 pl-12 pr-4 text-sm text-cyan-50 outline-none transition-all focus:border-cyan-500/50 shadow-inner placeholder:text-zinc-700 font-mono" 
                          placeholder="https://target-application.com" 
                        />
                      </div>

                      {/* ✨ ZAP FEATURE MATRIX ✨ */}
                      <div className="mb-6">
                        <div className="flex items-center gap-2 mb-4">
                          <LayoutGrid size={16} className="text-cyan-400" />
                          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest">ZAP Attack Modules</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                          {[
                            { id: 'spider', label: 'Standard Spider', icon: Globe, desc: 'Fast endpoint discovery' },
                            { id: 'ajax', label: 'AJAX Spider', icon: FileCode2, desc: 'Dynamic JS & SPA crawling' },
                            { id: 'passive', label: 'Passive Scan', icon: Server, desc: 'Header & misconfig analysis' },
                            { id: 'active', label: 'Active Scan', icon: Bug, desc: 'Deep injection fuzzing (SQLi, XSS)' }
                          ].map(feature => {
                            const isActive = zapConfig.features.includes(feature.id);
                            return (
                              <button
                                key={feature.id}
                                onClick={() => toggleZapFeature(feature.id)}
                                className={`p-4 rounded-xl border text-left transition-all duration-300 relative overflow-hidden group ${
                                  isActive 
                                    ? 'bg-cyan-950/30 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.1)]' 
                                    : 'bg-[#09090b] border-zinc-800 hover:border-zinc-700 opacity-70 hover:opacity-100'
                                }`}
                              >
                                {isActive && <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500 shadow-[0_0_10px_#06b6d4]" />}
                                <div className="flex items-center justify-between mb-2 relative z-10">
                                  <feature.icon size={16} className={isActive ? 'text-cyan-400' : 'text-zinc-500'} />
                                  <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-cyan-400 animate-pulse' : 'bg-zinc-800'}`} />
                                </div>
                                <h4 className={`text-xs font-bold uppercase tracking-wider mb-1 relative z-10 ${isActive ? 'text-cyan-50' : 'text-zinc-400'}`}>{feature.label}</h4>
                                <p className={`text-[9px] font-mono relative z-10 ${isActive ? 'text-cyan-500/70' : 'text-zinc-600'}`}>{feature.desc}</p>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* ✨ ZAP ENGINE SETTINGS ✨ */}
                      <div className="bg-[#050505] border border-zinc-800 rounded-xl overflow-hidden transition-colors mb-6">
                        <button 
                          onClick={() => setShowZapConfig(!showZapConfig)}
                          className="w-full flex items-center justify-between p-4 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors hover:bg-zinc-900/50"
                        >
                          <div className="flex items-center gap-2">
                            <Sliders size={14} className={showZapConfig ? 'text-cyan-400' : ''} />
                            Engine & Stealth Parameters
                          </div>
                          <ChevronRight size={14} className={`transition-transform duration-300 ${showZapConfig ? 'rotate-90' : ''}`} />
                        </button>

                        <AnimatePresence>
                          {showZapConfig && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-zinc-800 bg-zinc-950">
                              <div className="p-5 flex flex-col gap-6">
                                
                                <div>
                                  <div className="flex justify-between items-center mb-2">
                                    <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Active Scan Strength</label>
                                    <span className="text-xs font-black text-cyan-400 font-mono bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-500/20">{zapConfig.scanStrength}</span>
                                  </div>
                                  <select 
                                    value={zapConfig.scanStrength}
                                    onChange={(e) => setZapConfig({...zapConfig, scanStrength: e.target.value})}
                                    className="w-full bg-[#09090b] border border-zinc-800 rounded-lg py-2 px-3 text-sm text-zinc-200 outline-none focus:border-cyan-500"
                                  >
                                    <option value="Low">Low (Fewer Requests)</option>
                                    <option value="Default">Default (Balanced)</option>
                                    <option value="High">High (Aggressive)</option>
                                    <option value="Insane">Insane (Warning: High Load)</option>
                                  </select>
                                </div>

                                <div className="grid grid-cols-1">
                                  <button 
                                    onClick={() => setZapConfig({...zapConfig, stealthMode: !zapConfig.stealthMode})}
                                    className={`flex items-center justify-between p-4 rounded-lg border text-left transition-colors ${zapConfig.stealthMode ? 'bg-indigo-950/30 border-indigo-500/50 text-indigo-400' : 'bg-[#09090b] border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
                                  >
                                    <div>
                                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-300">WAF Evasion (Stealth)</p>
                                      <p className="text-[9px] opacity-70 font-mono mt-1">Add delays between requests to evade basic firewalls</p>
                                    </div>
                                    <div className={`w-3 h-3 rounded border ${zapConfig.stealthMode ? 'bg-indigo-400 border-indigo-300 shadow-[0_0_10px_#818cf8]' : 'bg-zinc-900 border-zinc-700'}`} />
                                  </button>
                                </div>

                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <button 
                        onClick={() => runScan('web', 'web', { target: targetUrl, config: zapConfig })} 
                        disabled={scanState.isActive || userRole === 'auditor'}
                        className="w-full relative overflow-hidden inline-flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-zinc-950 px-4 py-4 rounded-xl text-sm font-black tracking-widest transition-all disabled:opacity-50 group shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] uppercase"
                      >
                        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.3)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] bg-[position:200%_0,0_0] bg-no-repeat transition-[background-position_0s_ease] group-hover:bg-[position:-100%_0,0_0] duration-[1500ms]" />
                        <Activity size={18} className={scanState.isActive ? 'animate-spin' : ''} /> 
                        {scanState.isActive ? 'ZAP ENGINE ACTIVE...' : 'INITIALIZE ZAP ENGINE'}
                      </button>
                    </div>

                    {/* ✨ ZAP TERMINAL STYLED PROGRESS BAR ✨ */}
                    {scanState.isActive && scanState.type === 'web' && (
                      <div className="w-full bg-black border border-cyan-500/30 rounded-xl p-5 mt-4 relative overflow-hidden shadow-[0_0_30px_rgba(6,182,212,0.1)] z-20 font-mono">
                        <div className="flex items-center justify-between mb-3 border-b border-cyan-900/30 pb-2">
                          <div className="flex items-center gap-2 text-[10px] font-bold text-cyan-500">
                            <TerminalSquare size={14} /> proxy@localhost:8080 - target: {targetUrl || 'unknown'}
                          </div>
                          <span className="text-[10px] text-cyan-400 font-black">{scanState.progress}%</span>
                        </div>
                        
                        <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden mb-3">
                          <div className="h-full bg-cyan-500 shadow-[0_0_10px_#06b6d4] transition-all duration-300" style={{ width: `${scanState.progress}%` }} />
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
                          <p className="text-[10px] text-zinc-400 tracking-wider">
                            [INF] Proxying traffic... {scanState.phase}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {renderFindingsList(activeWeb)}
                    
                  </div>
                </motion.div>
              )}

              {/* CONTAINER SECURITY PAGE */}
              {activeTab === 'Container Security' && (
                <motion.div key="container" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className={`relative ${userRole === 'auditor' ? 'h-[80vh] overflow-hidden' : 'min-h-[80vh]'}`}>
                  {/* ✨ RBAC: SCANNERS LOCKED FOR AUDITORS */}
                  {userRole === 'auditor' && (
                    <div className="absolute inset-0 z-[999] backdrop-blur-md bg-[#09090b]/60 rounded-xl flex flex-col items-center justify-center text-center border border-indigo-500/20 shadow-2xl overflow-hidden">
                      <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,tra{userRole === 'auditor' && (nsparent,transparent_10px,rgba(99,102,241,0.05)_10px,rgba(99,102,241,0.05)_20px)] pointer-events-none" />
                      <div className="bg-indigo-500/10 p-5 rounded-full mb-6 relative z-10 border border-indigo-500/20">
                         <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping opacity-50"></div>
                         <ShieldCheck size={40} className="text-indigo-500 relative z-10" />
                      </div>
                      <h3 className="text-2xl font-black text-white uppercase tracking-widest mb-3 relative z-10">Clearance Required</h3>
                      <p className="text-zinc-300 text-sm max-w-md mb-8 leading-relaxed relative z-10">
                        Your <strong className="text-indigo-400">Auditor</strong> profile restricts access to active scanning execution and raw source code environments. Please review aggregated risk metrics on the Dashboard.
                      </p>
                      <button onClick={() => setActiveTab('Dashboard')} className="bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 text-white px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 shadow-xl relative z-10"><ChevronLeft size={16} /> Return to Dashboard</button>
                    </div>
                  )}
                  <div className="mb-6 relative z-20 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-white tracking-tight">Container & IaC Security</h2>
                      <p className="text-sm text-zinc-500 mt-1">Scan public registry images for CVEs or analyze raw Dockerfiles for misconfigurations.</p>
                    </div>
                  </div>

                  <div className="flex gap-2 p-1.5 bg-[#09090b] border border-zinc-800 rounded-lg w-max mb-6 relative z-20 shadow-inner">
                    {['image', 'dockerfile'].map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setContainerScanMode(mode)}
                        className={`relative px-6 py-2 text-sm font-semibold rounded-md transition-colors z-10 ${containerScanMode === mode ? 'text-indigo-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                      >
                        {containerScanMode === mode && (
                          <motion.div
                            layoutId="containerModeActive"
                            className="absolute inset-0 rounded-md -z-10 bg-indigo-500/10 border border-indigo-500/30"
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                          />
                        )}
                        {mode === 'image' ? 'Registry Image' : 'Raw Dockerfile'}
                      </button>
                    ))}
                  </div>

                  <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800 rounded-xl p-6 relative z-20 overflow-hidden shadow-lg">
                    <AnimatePresence mode="wait">
                      {containerScanMode === 'image' ? (
                        <motion.div key="image" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }} className="relative mb-8">
                          <Box className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18}/>
                          <input 
                            type="text" 
                            value={containerImage}                                      
                            onChange={(e) => setContainerImage(e.target.value)} 
                            className="w-full bg-[#050505] border border-zinc-800 rounded-lg py-4 pl-12 pr-4 text-sm text-zinc-200 outline-none transition-all focus:border-indigo-500/50 shadow-inner" 
                            placeholder="e.g., nginx:latest or python:3.9-slim" 
                          />
                        </motion.div>
                      ) : (
                        <motion.div key="dockerfile" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="relative mb-8">
                          <FileCode className="absolute left-4 top-4 text-zinc-500" size={18}/>
                          <textarea 
                            value={dockerfileContent} 
                            onChange={(e) => setDockerfileContent(e.target.value)} 
                            className="w-full h-48 bg-[#050505] border border-zinc-800 rounded-lg py-4 pl-12 pr-4 text-sm text-zinc-300 font-mono outline-none transition-all focus:border-indigo-500/50 shadow-inner resize-none placeholder:text-zinc-700" 
                            placeholder="FROM ubuntu:latest&#10;USER root&#10;RUN apt-get update..." 
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <button 
                    onClick={() => {
                      // 🛑 1. THE BOUNCER: Check the input first!
                      const currentInput = containerScanMode === 'image' ? containerImage : dockerfileContent; // ✨ CHANGED THIS
                      const validationType = containerScanMode === 'image' ? 'registry' : 'raw';
                      
                      if (!validateContainerInput(currentInput, validationType)) return;

                      // ✅ 2. THE ROUTING: Call the specific backend endpoint
                      if (containerScanMode === 'image') {
                        runScan('container', 'container', { image: containerImage }); // ✨ CHANGED THIS
                      } else {
                        runScan('dockerfile', 'dockerfile', { content: dockerfileContent }); 
                      }
                    }} 
                    disabled={scanState.isActive || userRole === 'auditor'}
                    className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-4 rounded-lg text-sm font-black transition-all duration-300 disabled:opacity-50 shadow-lg shadow-indigo-900/20"
                  >
                    <Zap size={18} className={scanState.isActive ? 'animate-spin' : ''} /> 
                    ANALYZE {containerScanMode === 'image' ? 'IMAGE' : 'DOCKERFILE'}
                  </button>
                  
                  {renderProgressBar('container')}
                </div>
                
                {/* ✨ THE SEPARATED RENDER ✨ */}
                <div className="mt-8">
                  {containerScanMode === 'image' ? (
                    <>
                      <div className="flex items-center gap-2 mb-4 px-1 border-b border-zinc-800 pb-2">
                        <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                        <span className="text-[10px] font-black text-cyan-500 uppercase tracking-widest">Live Registry Audit Results</span>
                      </div>
                      {renderFindingsList(activeRegistry)} 
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-4 px-1 border-b border-zinc-800 pb-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Static Dockerfile Analysis</span>
                      </div>
                      {renderFindingsList(activeDockerfile)}
                    </>
                  )}
                </div>
              </motion.div>
            )}

              {/* DATABASE SECURITY PAGE */}
              {activeTab === 'Database Security' && (
                <motion.div key="database" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className={`relative ${userRole === 'auditor' ? 'h-[80vh] overflow-hidden' : 'min-h-[80vh]'}`}>
                  
                  {/* ✨ RBAC: SCANNERS LOCKED FOR AUDITORS */}
                  {userRole === 'auditor' && (
                    <div className="absolute inset-0 z-[999] backdrop-blur-md bg-[#09090b]/60 rounded-xl flex flex-col items-center justify-center text-center border border-emerald-500/20 shadow-2xl overflow-hidden">
                      <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(16,185,129,0.05)_10px,rgba(16,185,129,0.05)_20px)] pointer-events-none" />
                      <div className="bg-emerald-500/10 p-5 rounded-full mb-6 relative z-10 border border-emerald-500/20">
                         <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping opacity-50"></div>
                         <ShieldCheck size={40} className="text-emerald-500 relative z-10" />
                      </div>
                      <h3 className="text-2xl font-black text-white uppercase tracking-widest mb-3 relative z-10">Clearance Required</h3>
                      <p className="text-zinc-300 text-sm max-w-md mb-8 leading-relaxed relative z-10">
                        Your <strong className="text-emerald-400">Auditor</strong> profile restricts access to active infrastructure auditing. Please review aggregated risk metrics on the Dashboard.
                      </p>
                      <button onClick={() => setActiveTab('Dashboard')} className="bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 text-white px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 shadow-xl relative z-10"><ChevronLeft size={16} /> Return to Dashboard</button>
                    </div>
                  )}

                  <div className="mb-6 relative z-20 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                        <Database size={24} className="text-emerald-400" /> Database Infrastructure Assessment
                      </h2>
                      <p className="text-sm text-zinc-500 mt-1">Audit internal IAM privileges, password policies, and network exposure.</p>
                    </div>
                  </div>

                  <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800 rounded-xl p-6 relative z-20 overflow-hidden shadow-lg mb-6">
                    
                    {/* Database Type Dropdown - NOW FULLY UNLOCKED */}
                    <div className="mb-6">
                      <label className="text-[12px] text-zinc-500 font-bold uppercase tracking-widest mb-2 block">Target Architecture</label>
                      <div className="relative">
                        <HardDrive className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                        <select 
                          value={dbConfig.db_type}
                          onChange={(e) => {
                            setDbConfig({...dbConfig, db_type: e.target.value});
                            if(e.target.value === 'postgresql') setDbConfig(prev => ({...prev, db_type: e.target.value, port: '5432'}));
                            if(e.target.value === 'mssql') setDbConfig(prev => ({...prev, db_type: e.target.value, port: '1433'}));
                            if(e.target.value === 'oracle') setDbConfig(prev => ({...prev, db_type: e.target.value, port: '1521'}));
                            if(e.target.value === 'mysql') setDbConfig(prev => ({...prev, db_type: e.target.value, port: '3306'}));
                          }}
                          className="w-full bg-[#050505] border border-zinc-800 rounded-lg py-4 pl-12 pr-4 text-sm text-zinc-200 outline-none focus:border-emerald-500/50 appearance-none cursor-pointer font-bold"
                        >
                          <option value="mysql">MySQL Enterprise Edition</option>
                          <option value="postgresql">PostgreSQL Server</option>
                          <option value="mssql">Microsoft SQL Server</option>
                          <option value="oracle">Oracle Database</option>
                        </select>
                      </div>
                    </div>

                    {/* Connection Config Inputs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                      <div className="relative">
                        <Server className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                        <input type="text" placeholder="Host (e.g., localhost or 10.0.0.5)" value={dbConfig.host} onChange={(e) => setDbConfig({...dbConfig, host: e.target.value})} className="w-full bg-[#050505] border border-zinc-800 rounded-lg py-3 pl-12 pr-4 text-sm text-zinc-200 outline-none focus:border-emerald-500/50" />
                      </div>
                      <div className="relative">
                        <p className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-bold">PORT</p>
                        <input type="text" placeholder="Port" value={dbConfig.port} onChange={(e) => setDbConfig({...dbConfig, port: e.target.value})} className="w-full bg-[#050505] border border-zinc-800 rounded-lg py-3 pl-14 pr-4 text-sm text-zinc-200 outline-none focus:border-emerald-500/50 font-mono" />
                      </div>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                        <input type="text" placeholder="Username (e.g., root or sa)" value={dbConfig.user} onChange={(e) => setDbConfig({...dbConfig, user: e.target.value})} className="w-full bg-[#050505] border border-zinc-800 rounded-lg py-3 pl-12 pr-4 text-sm text-zinc-200 outline-none focus:border-emerald-500/50" />
                      </div>
                      <div className="relative">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                        <input type="password" placeholder="Password" value={dbConfig.password} onChange={(e) => setDbConfig({...dbConfig, password: e.target.value})} className="w-full bg-[#050505] border border-zinc-800 rounded-lg py-3 pl-12 pr-4 text-sm text-zinc-200 outline-none focus:border-emerald-500/50" />
                      </div>
                    </div>

                    <button 
                      onClick={executeDatabaseScan} 
                      disabled={scanState.isActive || userRole === 'auditor'}
                      className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-4 rounded-lg text-sm font-black transition-all duration-300 disabled:opacity-50 shadow-lg shadow-emerald-900/20"
                    >
                      <Database size={18} className={scanState.isActive ? 'animate-bounce' : ''} /> 
                      AUTHENTICATE & AUDIT INFRASTRUCTURE
                    </button>
                    
                    {scanState.isActive && (
                      <div className="mt-6">
                        <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${scanState.progress}%` }} className="h-full bg-emerald-500 shadow-[0_0_15px_#10b981]" />
                        </div>
                        <p className="text-center text-[10px] text-zinc-500 mt-2 uppercase tracking-widest animate-pulse">Establishing Secure Database Tunnel...</p>
                      </div>
                    )}
                  </div>

                  {renderFindingsList(activeDb)}

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
                <div className="p-6 overflow-y-auto flex-1 bg-[#050505] scrollbar-hide relative">
                  
                  {/* ✨ GRANULAR RBAC: POC LOCKED FOR DEVELOPERS ✨ */}
                  {userRole === 'developer' && (
                    <div className="absolute inset-0 z-[100] backdrop-blur-md bg-[#09090b]/80 flex flex-col items-center justify-center text-center border border-rose-500/20 shadow-2xl">
                      <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(244,63,94,0.05)_10px,rgba(244,63,94,0.05)_20px)] pointer-events-none" />
                      <div className="bg-rose-500/10 p-4 rounded-full mb-4 border border-rose-500/20">
                         <Lock size={32} className="text-rose-500" />
                      </div>
                      <h3 className="text-lg font-black text-white uppercase tracking-widest mb-2">Red Team Clearance Required</h3>
                      <p className="text-zinc-400 text-xs max-w-sm leading-relaxed px-4">
                        To prevent accidental detonation and enforce Separation of Duties (SoD), your <strong className="text-rose-400">Developer</strong> profile cannot generate live exploit payloads. Please consult Security QA to validate patches.
                      </p>
                    </div>
                  )}

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
                        disabled={userRole === 'developer'} 
                        className="bg-rose-600/10 border border-rose-500/40 text-rose-400 hover:bg-rose-600/20 px-8 py-3.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-3 shadow-[0_0_15px_rgba(244,63,94,0.15)] disabled:opacity-50 disabled:cursor-not-allowed"
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
                      
                      {/* 🛡️ LIVE REDTEAM OFFENSIVE INTERFACE */}
                      <div className="mt-8 border-t border-red-900/30 pt-6">
                        {showRedTeamWarning ? (
                          /* --- OFFENSIVE WARNING PANEL --- */
                          <div className="bg-red-950/20 border border-red-500/30 rounded-xl p-8 text-center shadow-2xl">
                            <ShieldAlert size={44} className="text-red-500 mx-auto mb-4 animate-pulse" />
                            <h4 className="text-red-400 font-black uppercase tracking-widest mb-2 text-sm">Restricted Offensive Console</h4>
                            <p className="text-zinc-400 text-xs mb-6 max-w-sm mx-auto leading-relaxed font-sans">
                              You are engaging the Nexus-Red AI. This interface provides weaponized bypass techniques and lateral movement strategies. Proceed only for authorized security validation.
                            </p>
                            <button 
                              onClick={() => setShowRedTeamWarning(false)}
                              className="bg-red-600 hover:bg-red-500 text-white px-10 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)]"
                            >
                              Initialize Offensive Link
                            </button>
                          </div>
                        ) : (
                          /* --- FULL REDTEAM CHAT (Mirror of Remediation UI) --- */
                          <div className="flex flex-col h-[450px] bg-black/60 rounded-xl border border-red-900/30 overflow-hidden shadow-2xl">
                            <div className="p-3 bg-red-950/20 border-b border-red-900/30 flex justify-between items-center">
                              <span className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-2">
                                <TerminalSquare size={14}/> root@nexus-red:~#
                              </span>
                              <div className="flex gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500/20"></div>
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500/40"></div>
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                              </div>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar bg-[radial-gradient(circle_at_top_right,rgba(153,27,27,0.05),transparent)]">
                              {(redTeamHistory[aiModal.Issue] || []).map((msg, idx) => (
                                <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                  <div className="flex items-center gap-2 mb-1 px-1">
                                    <span className="text-[9px] font-bold uppercase tracking-tighter text-zinc-600">
                                      {msg.role === 'user' ? 'Operator' : 'Nexus-Red'}
                                    </span>
                                  </div>
                                  <div className={`p-4 rounded-xl max-w-[85%] text-xs font-mono leading-relaxed ${msg.role === 'user' ? 'bg-red-600/10 border border-red-500/30 text-red-100' : 'bg-zinc-900/90 border border-zinc-800 text-zinc-300 shadow-xl'}`}>
                                    {msg.role === 'assistant' ? (
                                      <div className="ai-markdown-wrapper" dangerouslySetInnerHTML={{ __html: formatAiResponse(msg.content) }} />
                                    ) : msg.content}
                                  </div>
                                </div>
                              ))}
                              {redTeamLoading && (
                                <div className="flex items-center gap-2 text-red-500 text-[10px] font-black uppercase tracking-widest animate-pulse p-2">
                                  <Activity size={12} className="animate-spin" /> Calculating Attack Vector...
                                </div>
                              )}
                              <div ref={messagesEndRef} />
                            </div>

                            <div className="p-4 bg-zinc-950/80 border-t border-red-900/30 relative">
                              <input 
                                type="text"
                                placeholder={userRole === 'admin' ? "Request bypass payload or lateral movement strategy..." : "RedTeam Console Restricted to Admin"}
                                disabled={userRole !== 'admin' || redTeamLoading}
                                className="w-full bg-black border border-red-900/40 rounded-lg py-3 px-4 text-xs text-red-400 outline-none focus:border-red-500 font-mono shadow-inner placeholder:text-zinc-800 disabled:opacity-50"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && e.target.value.trim()) {
                                    handleRedTeamChat(e.target.value);
                                    e.target.value = '';
                                  }
                                }}
                              />
                              {userRole !== 'admin' && <Lock size={14} className="absolute right-7 top-7 text-zinc-700" />}
                            </div>
                          </div>
                        )}
                      </div>

                    </div>
                  )}
                </div>
              )}

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default App;