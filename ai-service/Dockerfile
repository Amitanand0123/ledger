FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    texlive-binaries \
    texlive-latex-base \
    texlive-latex-extra \ 
    texlive-fonts-recommended \
    && rm -rf /var/lib/apt/lists/*

COPY ai-service/requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire ai-service directory contents to /app (not the parent dir)
COPY ai-service/ .

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]