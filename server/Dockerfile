# 1. Use a stable, lightweight Python base
FROM python:3.9-slim

# 2. Set the working directory inside the container
WORKDIR /app

# 3. Install system dependencies and Aqua Trivy (for Container Security scanning)
# We need these to ensure the 'Container Audit' section of NexusSec works in the cloud.
RUN apt-get update && apt-get install -y \
    wget \
    apt-transport-https \
    gnupg \
    lsb-release \
    && wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | apt-key add - \
    && echo deb https://aquasecurity.github.io/trivy-repo/deb $(lsb_release -sc) main | tee -a /etc/apt/sources.list.d/trivy.list \
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
