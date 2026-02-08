# Kubernetes Deployment Guide

This guide explains how to deploy the Job Tracker application to a local Kubernetes cluster.

## Prerequisites

- **Docker Desktop** with Kubernetes enabled (Windows/Mac) OR **Minikube** (Linux/Mac/Windows)
- **kubectl** CLI tool installed
- **Skaffold** (optional, for local development with auto-reload)

### Enable Kubernetes on Docker Desktop (Windows/Mac)

1. Open Docker Desktop
2. Go to Settings → Kubernetes
3. Check "Enable Kubernetes"
4. Click "Apply & Restart"

### Or Install Minikube (Alternative)

```bash
# Windows (using Chocolatey)
choco install minikube

# Mac (using Homebrew)
brew install minikube

# Start Minikube
minikube start
```

## Setup Instructions

### Step 1: Create Secrets

**IMPORTANT:** Never commit `secrets.yaml` to version control!

1. Copy the example secrets file:
   ```bash
   # Windows
   copy infrastructure\kubernetes\secrets.yaml.example infrastructure\kubernetes\secrets.yaml

   # Linux/Mac
   cp infrastructure/kubernetes/secrets.yaml.example infrastructure/kubernetes/secrets.yaml
   ```

2. Generate secure secrets:
   ```bash
   # Generate JWT_SECRET (32+ characters)
   openssl rand -base64 32

   # Generate NEXTAUTH_SECRET (32+ characters)
   openssl rand -base64 32

   # Generate a secure postgres password
   openssl rand -base64 16
   ```

3. Edit `secrets.yaml` and replace all placeholder values with base64-encoded secrets:
   ```bash
   # Encode a value to base64
   # Windows (PowerShell)
   [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes("your-secret-value"))

   # Linux/Mac
   echo -n "your-secret-value" | base64
   ```

4. Fill in the following secrets:
   - **postgres-secret**: `postgres-password`
   - **backend-secret**: `jwt-secret`, `aws-access-key-id` (optional), `aws-secret-access-key` (optional)
   - **frontend-secret**: `nextauth-secret`, `google-client-id` (optional), `google-client-secret` (optional)
   - **ai-service-secret**: `gemini-api-key`, `pinecone-api-key`, `ai-service-api-key`

### Step 2: Configure Application Settings

Edit `infrastructure/kubernetes/configmap.yaml` if you need to change:
- Database settings
- AWS region/bucket
- Frontend URL
- Feature flags

### Step 3: Build Docker Images

Build all Docker images from the **ledger/ directory** (monorepo root):

```bash
# Windows
cd ledger
infrastructure\kubernetes\build-images.bat

# Linux/Mac
cd ledger
chmod +x infrastructure/kubernetes/build-images.sh
./infrastructure/kubernetes/build-images.sh
```

This will build:
- `job-tracker-backend:latest`
- `job-tracker-frontend:latest`
- `job-tracker-ai:latest`

### Step 4: Deploy to Kubernetes

Deploy all manifests:

```bash
kubectl apply -f infrastructure/kubernetes/
```

This will create:
- Namespace: `job-tracker`
- Secrets and ConfigMaps
- Postgres database with persistent storage
- Backend API (2 replicas)
- Frontend (2 replicas)
- AI Service (1 replica)
- Horizontal Pod Autoscalers
- Ingress for routing

### Step 5: Verify Deployment

Check pod status:
```bash
kubectl get pods -n job-tracker

# Expected output:
# NAME                          READY   STATUS    RESTARTS   AGE
# postgres-xxxxx                1/1     Running   0          1m
# backend-xxxxx                 1/1     Running   0          1m
# backend-yyyyy                 1/1     Running   0          1m
# frontend-xxxxx                1/1     Running   0          1m
# frontend-yyyyy                1/1     Running   0          1m
# ai-service-xxxxx              1/1     Running   0          1m
```

Check services:
```bash
kubectl get svc -n job-tracker
```

View logs:
```bash
# Backend logs
kubectl logs -n job-tracker -l app=backend --tail=50 -f

# Frontend logs
kubectl logs -n job-tracker -l app=frontend --tail=50 -f
```

### Step 6: Access the Application

#### Option A: Port Forwarding (Quick Access)

```bash
# Forward frontend
kubectl port-forward -n job-tracker svc/frontend 3021:3021

# Forward backend (in another terminal)
kubectl port-forward -n job-tracker svc/backend 5000:5000
```

Then access:
- Frontend: http://localhost:3021
- Backend API: http://localhost:5000

#### Option B: Ingress (Recommended)

1. Add to your hosts file:
   ```
   # Windows: C:\Windows\System32\drivers\etc\hosts
   # Linux/Mac: /etc/hosts
   127.0.0.1 jobtracker.local
   ```

2. Access the application:
   - http://jobtracker.local

## Database Migrations

Run migrations in the backend pod:

```bash
# Get the backend pod name
kubectl get pods -n job-tracker -l app=backend

# Run migrations
kubectl exec -n job-tracker -it <backend-pod-name> -- npm run db:migrate

# Or use the start command (it auto-runs migrations)
# The backend deployment already runs "prisma migrate deploy" on startup
```

## Local Development with Skaffold

For local development with automatic rebuild and redeploy:

```bash
# Install Skaffold (if not installed)
# Windows (Chocolatey)
choco install skaffold

# Mac (Homebrew)
brew install skaffold

# Run in dev mode (auto-reload on code changes)
skaffold dev

# Or run in debug mode
skaffold debug
```

Skaffold will:
- Build Docker images
- Deploy to Kubernetes
- Stream logs from all pods
- Auto-rebuild and redeploy on code changes
- Forward ports automatically

## Scaling

### Manual Scaling

```bash
# Scale backend replicas
kubectl scale deployment backend -n job-tracker --replicas=5

# Scale frontend replicas
kubectl scale deployment frontend -n job-tracker --replicas=3
```

### Horizontal Pod Autoscaling (HPA)

HPA is already configured for backend and frontend:
- **Backend**: 2-10 replicas (70% CPU / 80% Memory)
- **Frontend**: 2-5 replicas (70% CPU / 80% Memory)

View HPA status:
```bash
kubectl get hpa -n job-tracker
```

## Monitoring & Debugging

### View all resources
```bash
kubectl get all -n job-tracker
```

### Describe a pod
```bash
kubectl describe pod <pod-name> -n job-tracker
```

### Exec into a pod
```bash
kubectl exec -n job-tracker -it <pod-name> -- sh
```

### View events
```bash
kubectl get events -n job-tracker --sort-by='.lastTimestamp'
```

### Health checks
```bash
# Backend health
curl http://localhost:5000/health

# Backend readiness
curl http://localhost:5000/health/ready

# Backend liveness
curl http://localhost:5000/health/live
```

## Cleanup

### Delete all resources
```bash
kubectl delete namespace job-tracker
```

### Delete specific deployments
```bash
kubectl delete deployment backend -n job-tracker
kubectl delete deployment frontend -n job-tracker
```

### Stop Skaffold
Press `Ctrl+C` in the Skaffold terminal

## Troubleshooting

### Pods stuck in "Pending" state
```bash
kubectl describe pod <pod-name> -n job-tracker
# Check for resource constraints or image pull errors
```

### Pods stuck in "CrashLoopBackOff"
```bash
kubectl logs <pod-name> -n job-tracker
# Check application logs for errors
```

### Database connection errors
1. Check if postgres pod is running: `kubectl get pods -n job-tracker`
2. Check backend logs: `kubectl logs -n job-tracker -l app=backend`
3. Verify DATABASE_URL in secrets.yaml matches postgres service name
4. Ensure postgres password matches in both postgres-secret and backend DATABASE_URL

### Image pull errors
- Ensure images are built locally: Run `build-images.bat` or `build-images.sh`
- Verify `imagePullPolicy: Never` is set in deployments

### Port already in use
- Stop any local services running on ports 3021, 5000, or 5433
- Or change the port-forward ports: `kubectl port-forward svc/frontend 8080:3021`

## Production Considerations

For production deployment, update:

1. **Secrets**: Use a secrets management solution (HashiCorp Vault, AWS Secrets Manager)
2. **Ingress**: Configure proper TLS certificates and domain
3. **Storage**: Use cloud-based persistent volumes (AWS EBS, GCP Persistent Disk)
4. **Database**: Consider managed database service (RDS, Cloud SQL)
5. **Image Registry**: Push images to a container registry (Docker Hub, ECR, GCR)
6. **Monitoring**: Add Prometheus, Grafana, and logging (ELK/EFK stack)
7. **Resource Limits**: Tune based on actual usage patterns
8. **Backup**: Configure database backup and disaster recovery

## Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Skaffold Documentation](https://skaffold.dev/)
- [kubectl Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)
