# server/app.py
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from groq import Groq
import requests
import os
import shutil
import stat
import re
import subprocess
import time
import urllib.parse
import json
import tempfile
import os
import mysql.connector
from mysql.connector import Error as MySQLError
from dotenv import load_dotenv
from git import Repo
from zapv2 import ZAPv2

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")
GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")

app = Flask(__name__)
CORS(app) 

ZAP_API_KEY = '' 
ZAP_PROXY = {'http': 'http://127.0.0.1:8080', 'https': 'http://127.0.0.1:8080'}

# 🛡️ THE NEW ENTERPRISE & BIZ-OPS SECRETS DICTIONARY
SECRET_PATTERNS = {
    # --- CLOUD INFRASTRUCTURE ---
    "AWS Access Key": r"(A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}",
    "AWS Secret Key": r"(?i)aws_secret_access_key[ \t]*[:=][ \t]*['\"]?[A-Za-z0-9/+=]{40}['\"]?",
    "GitHub Personal Access Token": r"ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59}",
    "Google Cloud API Key": r"AIza[0-9A-Za-z\\-_]{35}",

    # --- BIZ OPS & STARTUP SAAS ---
    "Airtable PAT": r"pat[a-zA-Z0-9]{14}\.[a-zA-Z0-9]{64}", 
    "Airtable Legacy API Key": r"key[a-zA-Z0-9]{14}",
    "Notion API Secret": r"(secret|ntn)_[a-zA-Z0-9]{33,43}",
    "HubSpot Private App Token": r"pat-[a-z0-9]{2,3}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}",
    "Salesforce Access Token": r"00D[a-zA-Z0-9]{12,15}!.*",
    "Zapier Webhook URL": r"https:\/\/hooks\.zapier\.com\/hooks\/catch\/[a-zA-Z0-9]+\/[a-zA-Z0-9]+\/?",
    "Zendesk API Token": r"(?i)zendesk[ _a-z]*['\"]?[:=]['\"]?[a-zA-Z0-9]{40}",
    "Asana Personal Access Token": r"[01]\/[0-9]{1,20}:[a-zA-Z0-9]{32}",
    "Atlassian/Jira API Token": r"ATATT3xFfGF0[a-zA-Z0-9\-_]{160,}",
    "Typeform Personal Access Token": r"tfp_[a-zA-Z0-9]{40,}_[a-zA-Z0-9]{14,}",
    "Stripe Standard API Key": r"sk_live_[0-9a-zA-Z]{24,99}",
    "Stripe Restricted API Key": r"rk_live_[0-9a-zA-Z]{24,99}",
    
    # --- COMMUNICATION & AI ---
    "Slack Token": r"xox[baprs]-[0-9a-zA-Z]{10,}",
    "Mailchimp API Key": r"[0-9a-f]{32}-us[0-9]{1,2}",
    "OpenAI API Key": r"sk-(proj-)?[a-zA-Z0-9_\-]{48,}",
    "Twilio API Key": r"SK[0-9a-fA-F]{32}",
    "SendGrid API Key": r"SG\.[a-zA-Z0-9_-]{22}\.[a-zA-Z0-9_-]{43}",

    # --- CRYPTOGRAPHIC KEYS ---
    "RSA Private Key": r"-----BEGIN RSA PRIVATE KEY-----",
    "SSH Private Key": r"-----BEGIN OPENSSH PRIVATE KEY-----",
    "PGP Private Key": r"-----BEGIN PGP PRIVATE KEY BLOCK-----",
    
    # --- FALLBACK GENERICS ---
    "Generic API Key": r"(?i)(api_key|access_token|secret_key|auth_token|client_secret)[ \t]*=[ \t]*['\"][0-9a-zA-Z\-_]{16,}['\"]",
    "Generic Password": r"(?i)(password|passwd|pwd)[ \t]*=[ \t]*['\"][0-9a-zA-Z\-_@#$]{8,}['\"]"
}

# ==========================================
# 🛠️ HELPER FUNCTIONS
# ==========================================
def remove_readonly(func, path, _):
    try:
        os.chmod(path, stat.S_IWRITE)
        func(path)
    except:
        pass

def scan_secrets(repo_dir):
    """Deep scans every file format for hardcoded credentials."""
    findings = []
    for root, _, files in os.walk(repo_dir):
        if ".git" in root: continue
        for file in files:
            file_path = os.path.join(root, file)
            try:
                # Skip massive files (e.g., compiled binaries) to save RAM
                if os.path.getsize(file_path) > 1024 * 1024: continue
                with open(file_path, "r", errors="ignore") as f:
                    content = f.read()
                    for name, pattern in SECRET_PATTERNS.items():
                        if re.search(pattern, content):
                            findings.append({
                                "Type": "Secret Leak",
                                "Severity": "Critical",
                                "Issue": f"Hardcoded {name} exposed in repository.",
                                "Fix": f"{file}"
                            })
            except:
                continue
    return findings

# ==========================================
# 🚀 FLASK API ROUTES
# ==========================================

@app.route('/api/auth/github', methods=['POST'])
def api_github_auth():
    code = request.json.get('code')
    if not code: return jsonify({"error": "No code provided"}), 400

    token_res = requests.post(
        'https://github.com/login/oauth/access_token',
        headers={'Accept': 'application/json'},
        data={'client_id': GITHUB_CLIENT_ID, 'client_secret': GITHUB_CLIENT_SECRET, 'code': code}
    )
    token = token_res.json().get('access_token')
    if not token: return jsonify({"error": "Failed to get token"}), 400

    repos = []
    headers = {'Authorization': f'Bearer {token}', 'Accept': 'application/vnd.github.v3+json'}
    try:
        repo_res = requests.get('https://api.github.com/user/repos?sort=updated&per_page=100&type=owner', headers=headers)
        if repo_res.status_code == 200:
            repos = [r['clone_url'] for r in repo_res.json()]
    except Exception as e:
        print("Error fetching repos:", e)

    return jsonify({"status": "success", "token": token, "repos": repos})

@app.route('/api/scan/github', methods=['POST'])
def scan_github():
    data = request.json
    repo_url = data.get('repo')
    
    if not repo_url:
        return jsonify({"error": "No repository URL provided."}), 400

    if not repo_url.endswith('.git'):
        repo_url = repo_url + '.git'

    try:
        # 1. Create an isolated workspace
        with tempfile.TemporaryDirectory() as temp_dir:
            print(f"📦 Pulling {repo_url} into secure temp directory...")
            subprocess.run(["git", "clone", "--depth", "1", repo_url, temp_dir], check=True, capture_output=True)
            
            # 2. Map the target files (Polyglot Support)
            target_extensions = ('.py', '.js', '.ts', '.java', '.cpp', '.go', '.php', '.rb')
            files_to_scan = []
            
            for root, dirs, files in os.walk(temp_dir):
                if '.git' in dirs:
                    dirs.remove('.git') # Skip git history
                for file in files:
                    if file.endswith(target_extensions):
                        files_to_scan.append(os.path.join(root, file))
            
            # Limit to 5 files for the live MVP demo to prevent Cloud API timeouts
            files_to_scan = files_to_scan[:5]
            
            # 3. ENGAGE NEURAL CLOUD SAST API
            print(f"☁️ Uploading {len(files_to_scan)} files to Groq LLaMA 3.3 for Multi-Language Analysis...")
            client = Groq(api_key=GROQ_API_KEY) # Make sure your GROQ_API_KEY is defined in your app.py
            all_findings = []
            
            for filepath in files_to_scan:
                with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                    code_content = f.read()
                    
                # Skip empty files or massive files that break API token limits
                if not code_content.strip() or len(code_content) > 15000:
                    continue
                    
                clean_path = filepath.replace(temp_dir + os.sep, '').replace(temp_dir + '/', '')
                print(f"🔍 Analyzing: {clean_path}")
                
                # Command the LLM to act as a strict SAST JSON API
                prompt = f"""
                You are a highly advanced Enterprise Cloud SAST API. Analyze the following source code for security vulnerabilities (e.g., OWASP Top 10, Injection, XSS, Weak Crypto, Hardcoded Secrets).
                
                You must respond ONLY with a valid JSON object. Do not include markdown formatting or explanations.
                The JSON must have a single key "findings" which is an array of objects.
                If no vulnerabilities are found, return {{"findings": []}}.
                
                Format requirement:
                {{
                  "findings": [
                    {{
                      "Issue": "Short, specific description of the vulnerability",
                      "Severity": "Critical", // Choose: Critical, High, Medium, Low
                      "Type": "Vulnerability Category (e.g., SQL Injection)",
                      "Fix": "File: {clean_path} | Provide a short 1-sentence fix"
                    }}
                  ]
                }}
                
                Code to analyze:
                {code_content}
                """
                
                try:
                    # Request JSON mode from the Groq Cloud API
                    completion = client.chat.completions.create(
                        messages=[{"role": "user", "content": prompt}],
                        model="llama-3.3-70b-versatile",
                        temperature=0.1, # Extremely low temperature for strict, analytical output
                        response_format={"type": "json_object"}
                    )
                    
                    # Parse the JSON response returned by the Cloud LLM
                    cloud_response = json.loads(completion.choices[0].message.content)
                    findings_array = cloud_response.get('findings', [])
                    all_findings.extend(findings_array)
                    
                except Exception as api_err:
                    print(f"⚠️ Cloud API Analysis failed for {clean_path}: {api_err}")
                    continue

            print(f"✅ Cloud Scan Complete. Synthesized {len(all_findings)} multi-language threats.")
            return jsonify({"findings": all_findings})
            
    except subprocess.CalledProcessError as e:
        print(f"🚨 Git Error: {e.stderr}")
        return jsonify({"error": "Failed to clone repository. Make sure the URL is public."}), 500
    except Exception as e:
        print(f"🚨 System Error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/scan/web', methods=['POST'])
def api_web_scan():
    target = request.json.get('target')
    findings = []
    try:
        zap = ZAPv2(apikey=ZAP_API_KEY, proxies=ZAP_PROXY)
        zap.core.version 
        scan_id = zap.spider.scan(target)
        time.sleep(2)
        while int(zap.spider.status(scan_id)) < 100: time.sleep(0.5)
        
        for a in zap.core.alerts(baseurl=target):
            findings.append({"Type": "Web DAST", "Severity": a['risk'].capitalize(), "Issue": a['name'], "Fix": "See ZAP Report"})
    except Exception as e:
        return jsonify({"error": "ZAP connection failed. Is ZAP running?"}), 500
        
    return jsonify({"status": "success", "findings": findings})

@app.route('/api/scan/container', methods=['POST'])
def scan_container():
    data = request.json
    # Default to nginx:latest if the user leaves the input blank
    image_name = data.get('image', 'nginx:latest') 
    findings = []
    
    try:
        print(f"\n🐳 REAL ENGINE ENGAGED: Initiating live Trivy scan on {image_name}...")
        print("   [Downloading image layers and querying the National Vulnerability Database...]")
        
        # This breaks out of Python and executes the actual Trivy binary on your OS
        cmd = ["trivy", "image", "--format", "json", "--quiet", image_name]
        
        # capture_output=True intercepts what Trivy would normally print to the terminal
        res = subprocess.run(cmd, capture_output=True, text=True)
        
        # Check if Trivy actually returned data
        if res.stdout:
            try:
                trivy_data = json.loads(res.stdout)
                
                # Dig through Trivy's complex JSON schema to find the actual vulnerabilities
                for result in trivy_data.get("Results", []):
                    for vuln in result.get("Vulnerabilities", []):
                        # Format it perfectly for our React dashboard
                        findings.append({
                            "Type": "Container OS Vulnerability",
                            "Severity": vuln.get("Severity", "UNKNOWN").capitalize(),
                            "Issue": f"{vuln.get('PkgName')} ({vuln.get('VulnerabilityID')}) - {vuln.get('Title', 'No title')}",
                            "Fix": f"Update to: {vuln.get('FixedVersion', 'No patch currently available')}"
                        })
            except json.JSONDecodeError:
                print("🚨 Error: Trivy did not return valid JSON. It might have encountered an error pulling the image.")
                return jsonify({"error": f"Failed to parse Trivy output. Ensure '{image_name}' is a valid public Docker image."}), 500

        print(f"✅ Real Container Scan Complete. Discovered {len(findings)} live CVEs.")
        return jsonify({"findings": findings})
        
    except FileNotFoundError:
        # This triggers if Python asks Windows/Linux to run "trivy" and the OS says "I don't know what that is"
        print("🚨 FATAL ERROR: Trivy binary not found in system PATH.")
        return jsonify({"error": "Trivy engine is not installed or not in your system PATH. Please install Aqua Security Trivy."}), 500
        
    except Exception as e:
        print(f"🚨 Unhandled Container Engine Failure: {str(e)}")
        return jsonify({"error": f"Internal Engine Error: {str(e)}"}), 500

@app.route('/api/scan/dockerfile', methods=['POST'])
def scan_dockerfile():
    data = request.json
    dockerfile_content = data.get('content')
    
    if not dockerfile_content:
        return jsonify({"error": "No Dockerfile content provided"}), 400

    findings = []
    temp_path = ""
    
    try:
        print("\n📄 REAL ENGINE ENGAGED: Initiating IaC scan on raw Dockerfile...")
        
        # 1. Create a secure, temporary file on your Windows/Linux machine to hold the code
        with tempfile.NamedTemporaryFile(delete=False, mode='w', suffix='Dockerfile') as temp_file:
            temp_file.write(dockerfile_content)
            temp_path = temp_file.name

        # 2. Command Trivy to scan the file for misconfigurations and bad base images
        cmd = ["trivy", "config", "--format", "json", "--quiet", temp_path]
        res = subprocess.run(cmd, capture_output=True, text=True)
        
        # 3. Parse the output
        if res.stdout:
            trivy_data = json.loads(res.stdout)
            
            for result in trivy_data.get("Results", []):
                for misconf in result.get("Misconfigurations", []):
                    findings.append({
                        "Type": "Dockerfile Misconfiguration",
                        "Severity": misconf.get("Severity", "UNKNOWN").capitalize(),
                        "Issue": misconf.get("Title", "Unknown Configuration Flaw"),
                        "Fix": misconf.get("Resolution", "Review Dockerfile best practices.")
                    })
                    
        print(f"✅ Dockerfile Scan Complete. Discovered {len(findings)} structural flaws.")
        return jsonify({"findings": findings})
        
    except Exception as e:
        print(f"🚨 Dockerfile Engine Failure: {str(e)}")
        return jsonify({"error": f"Internal Engine Error: {str(e)}"}), 500
        
    finally:
        # 4. ALWAYS clean up the temporary file so your server hard drive doesn't fill up
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)

@app.route('/api/ai/remediate', methods=['POST'])
def api_ai_remediate():
    finding = request.json.get('finding')
    try:
        client = Groq(api_key=GROQ_API_KEY)
        prompt = f"""
        Act as a Senior Cyber Security Engineer. 
        Vulnerability: "{finding.get('Issue')}"
        Type: {finding.get('Type')}
        Context: {finding.get('Fix')}

        Provide a structured Markdown response with these exact headings:
        ### 🚨 Why it's Dangerous
        ### 🛠️ Technical Fix
        ### 🔍 Verification
        """
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
        )
        return jsonify({"remediation": chat_completion.choices[0].message.content})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/ai/triage', methods=['POST'])
def api_ai_triage():
    findings = request.json.get('findings', [])
    if not findings:
        return jsonify({"triage_results": {}})

    try:
        client = Groq(api_key=GROQ_API_KEY)
        
        # We strip down the data to save tokens and speed up the AI
        slim_findings = [{"Issue": f["Issue"], "Severity": f["Severity"], "Type": f["Type"]} for f in findings[:15]]
        
        prompt = f"""
        You are an elite Application Security Architect. Review this list of vulnerabilities.
        Evaluate their true business risk. If a severity is inaccurate, change it. If it is accurate, keep it.
        
        Vulnerabilities: {json.dumps(slim_findings)}

        You MUST return ONLY a valid JSON object. 
        CRITICAL: Do NOT use double quotes inside your "reason" strings (use single quotes if needed).
        Format strictly like this:
        {{
            "Exact Issue Name": {{"severity": "Critical", "reason": "Short explanation without double quotes."}}
        }}
        """
        
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            temperature=0.1, # Low temperature for strict, analytical output
            response_format={"type": "json_object"} # 🌟 THE MAGIC FIX: Forces strict JSON output
        )
        
        raw_response = chat_completion.choices[0].message.content
        
        # Safely parse the JSON
        try:
            triage_results = json.loads(raw_response)
        except json.JSONDecodeError as e:
            print(f"🚨 JSON Parsing Error: {e}")
            print(f"Raw LLM Output was: {raw_response}")
            triage_results = {} # Fallback to empty so the app doesn't crash
            
        return jsonify({"triage_results": triage_results})
        
    except Exception as e:
        print("🚨 AI Triage Error:", str(e))
        return jsonify({"error": str(e)}), 500

@app.route('/api/ai/chat', methods=['POST'])
def api_ai_chat():
    finding = request.json.get('finding', {})
    history = request.json.get('history', [])
    
    try:
        client = Groq(api_key=GROQ_API_KEY)
        
        # 1. Build the System Context so the AI knows what we are talking about
        system_msg = {
            "role": "system", 
            "content": f"""You are NexusSec, an elite Application Security engineer. 
            You are assisting a developer with the following vulnerability:
            - Issue: {finding.get('Issue')}
            - Type: {finding.get('Type')}
            - Raw Scanner Output/Fix: {finding.get('Fix')}
            
            Keep your responses highly technical, concise, and use Markdown for code blocks. Do not apologize."""
        }
        
        # 2. Combine the System prompt with the user's ongoing chat history
        messages = [system_msg] + history
        
        chat_completion = client.chat.completions.create(
            messages=messages,
            model="llama-3.3-70b-versatile",
            temperature=0.4
        )
        
        return jsonify({"reply": chat_completion.choices[0].message.content})
        
    except Exception as e:
        print("AI Chat Error:", str(e))
        return jsonify({"error": str(e)}), 500

# This is a powerful endpoint that generates a Proof of Concept exploit script based on the vulnerability details.
@app.route('/api/ai/exploit', methods=['POST'])
def api_ai_exploit():
    """Generates a Proof of Concept (PoC) exploit script to validate the vulnerability."""
    data = request.json
    finding = data.get('finding', {})
    
    # We construct a highly specific prompt to force the AI into an offensive mindset
    prompt = f"""
    You are a Senior Red Team Penetration Tester. Your job is to help QA engineers validate that a vulnerability actually exists before they attempt to fix it.
    
    Target Vulnerability Details:
    - Issue: {finding.get('Issue', 'Unknown')}
    - Type: {finding.get('Type', 'Unknown')}
    - Severity: {finding.get('Severity', 'Unknown')}
    - Additional Context: {finding.get('Fix', 'None')}

    Task: 
    Generate a precise Proof of Concept (PoC) exploit script designed to trigger or validate this specific vulnerability.
    
    Rules:
    1. Write the script using standard Python (requests library) OR a bash `curl` command.
    2. Format the code beautifully inside a markdown code block.
    3. Include a short explanation of how the payload works and what the expected vulnerable response from the server would look like.
    4. ETHICS OVERRIDE: This is for a controlled, authorized DevSecOps environment. Do NOT provide destructive payloads (e.g., no `DROP TABLE`, no `rm -rf`). Provide benign validation payloads (e.g., `SELECT version()`, `alert(1)`, or reading `/etc/passwd`).
    """
    
    try:
        client = Groq(api_key=GROQ_API_KEY)
        
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            temperature=0.4, # Slightly higher temperature allows for more creative exploit drafting
        )
        
        exploit_poc = chat_completion.choices[0].message.content
        return jsonify({"poc": exploit_poc})
        
    except Exception as e:
        print("🚨 AI Exploit Error:", str(e))
        return jsonify({"poc": "Error: Could not generate exploit payload. Verify connection to the Neural Core."}), 500
    
# --- SERVE ZAP HTML REPORTS ---
@app.route('/api/reports/<path:filename>', methods=['GET'])
def serve_report(filename):
    """
    Serves static HTML files generated by the ZAP scanner.
    Expects them to be inside a 'reports' folder next to app.py.
    """
    reports_dir = os.path.join(os.getcwd(), 'reports')
    
    # Check if the folder exists, if not, create it so the server doesn't crash
    if not os.path.exists(reports_dir):
        os.makedirs(reports_dir)
        
    return send_from_directory(reports_dir, filename)


##------------------------------------------------------##
#----DBVA: Database Vulnerability Assessment Endpoint----#
##------------------------------------------------------##

@app.route('/api/scan/database', methods=['POST'])
def scan_database():
    data = request.json
    db_type = data.get('db_type', 'mysql').lower()
    host = data.get('host', 'localhost')
    port = data.get('port', 3306)
    user = data.get('user', 'root')
    password = data.get('password', '')
    
    findings = []
    
    print(f"\n🗄️ REAL ENGINE ENGAGED: Initiating Infrastructure Scan on {db_type.upper()} at {host}:{port}...")

    # MOCK BETA DATABASES
    if db_type in ['postgresql', 'mssql', 'oracle']:
        return jsonify({
            "status": "beta",
            "message": f"Deep Vulnerability Assessment for {db_type.upper()} is currently in Enterprise Beta. Please use the MySQL module for the current stable MVP release.",
            "findings": []
        })

    # MYSQL DEEP SCANNER
    if db_type == 'mysql':
        try:
            connection = mysql.connector.connect(
                host=host,
                port=port,
                user=user,
                password=password,
                connection_timeout=5
            )
            
            if connection.is_connected():
                cursor = connection.cursor(dictionary=True)
                
                # 1. Privilege Escalation Check (Global Super Admins)
                try:
                    cursor.execute("SELECT user, host FROM mysql.user WHERE Super_priv = 'Y';")
                    for su in cursor.fetchall():
                        if su['host'] == '%':
                            findings.append({
                                "Type": "IAM Misconfiguration",
                                "Severity": "Critical",
                                "Issue": f"Super Admin Account ({su['user']}@%) Exposed Globally",
                                "Fix": f"Restrict the '{su['user']}' account to 'localhost'."
                            })
                except Exception: pass

                # 2. Network Bind Address Check
                try:
                    cursor.execute("SHOW VARIABLES LIKE 'bind_address';")
                    bind_address = cursor.fetchone()
                    if bind_address and bind_address['Value'] in ['0.0.0.0', '*']:
                        findings.append({
                            "Type": "Network Exposure",
                            "Severity": "High",
                            "Issue": "Database Bound to Public Interface (0.0.0.0)",
                            "Fix": "Edit my.cnf to set bind-address = 127.0.0.1."
                        })
                except Exception: pass

                # 3. Password Validation Plugin Check
                try:
                    cursor.execute("SHOW VARIABLES LIKE 'validate_password%';")
                    pwd_policy = cursor.fetchall()
                    if not pwd_policy:
                        findings.append({
                            "Type": "Authentication Policy",
                            "Severity": "Medium",
                            "Issue": "Weak or Disabled Password Validation Plugin",
                            "Fix": "Enable the validate_password plugin to enforce strong credential requirements."
                        })
                except Exception: pass

                # 4. Anonymous User Check (HUGE risk, common in old XAMPP)
                try:
                    cursor.execute("SELECT user, host FROM mysql.user WHERE user = '';")
                    anon_users = cursor.fetchall()
                    if anon_users:
                        findings.append({
                            "Type": "Access Control",
                            "Severity": "Critical",
                            "Issue": "Anonymous User Accounts Detected",
                            "Fix": "Execute 'DROP USER \"\"@\"localhost\";' to remove anonymous access."
                        })
                except Exception: pass

                # 5. Local Infile Check (Allows hackers to read local server files via SQLi)
                try:
                    cursor.execute("SHOW VARIABLES LIKE 'local_infile';")
                    local_infile = cursor.fetchone()
                    if local_infile and local_infile['Value'].upper() == 'ON':
                        findings.append({
                            "Type": "Data Exfiltration Risk",
                            "Severity": "High",
                            "Issue": "LOCAL INFILE capability is enabled",
                            "Fix": "Set 'local_infile = 0' in my.cnf to prevent arbitrary file reading."
                        })
                except Exception: pass

                # 6. Default 'test' Database Check
                try:
                    cursor.execute("SHOW DATABASES LIKE 'test';")
                    test_db = cursor.fetchone()
                    if test_db:
                        findings.append({
                            "Type": "Configuration Best Practices",
                            "Severity": "Low",
                            "Issue": "Default 'test' database exists",
                            "Fix": "Execute 'DROP DATABASE test;' to remove unnecessary default databases."
                        })
                except Exception: pass

                # 7. Unencrypted Transport Check
                try:
                    cursor.execute("SHOW VARIABLES LIKE 'require_secure_transport';")
                    ssl_req = cursor.fetchone()
                    if ssl_req and ssl_req['Value'].upper() == 'OFF':
                        findings.append({
                            "Type": "Data in Transit",
                            "Severity": "Medium",
                            "Issue": "Unencrypted Traffic Allowed (SSL/TLS Not Required)",
                            "Fix": "Set 'require_secure_transport = ON' to force encrypted connections."
                        })
                except Exception: pass

                cursor.close()
                connection.close()
                
        except Exception as e:
            return jsonify({"error": f"Database Authentication Failed: {str(e)}"}), 401

    return jsonify({
        "status": "success",
        "findings": findings
    })

if __name__ == '__main__':
    app.run(port=5000, debug=True)
