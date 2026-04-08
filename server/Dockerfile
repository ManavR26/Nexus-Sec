# 1. Use a stable, lightweight Python base
FROM python:3.9-slim

# 2. Set the working directory inside the container
WORKDIR /app

# 3. Install system dependencies and Aqua Trivy (Modern Secure Method)
RUN apt-get update && apt-get install -y \
    wget \
    apt-transport-https \
    gnupg \
    lsb-release \
    && mkdir -p /etc/apt/keyrings \
    && wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | gpg --dearmor -o /etc/apt/keyrings/trivy.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/trivy.gpg] https://aquasecurity.github.io/trivy-repo/deb $(lsb_release -sc) main" | tee /etc/apt/sources.list.d/trivy.list \
    && apt-get update && apt-get install -y trivy \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# 4. Copy requirements first to leverage Docker caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 5. Copy the rest of the backend source code
COPY . .

# 6. Start the server using Gunicorn
# $PORT is automatically provided by Render's environment
CMD gunicorn --bind 0.0.0.0:$PORT app:app
