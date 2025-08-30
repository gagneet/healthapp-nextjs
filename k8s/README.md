# Kubernetes Manifests and Infrastructure as Code (IaC)

This directory contains the Kubernetes manifests required to deploy the HealthApp application to an Azure Kubernetes Service (AKS) cluster. These manifests are used by the Azure CI/CD pipeline in `azure-pipelines.yml` located in the root of this repository.

## The Role of this Pipeline (CI/CD) vs. Infrastructure as Code (IaC)

It is crucial to understand the difference between the role of the Azure Pipeline (Continuous Integration/Continuous Deployment) and Infrastructure as Code (IaC).

### This CI/CD Pipeline's Responsibility: Application Deployment

The `azure-pipelines.yml` file is responsible for the **application lifecycle**. Its job is to:
1.  **Build** a new Docker image whenever code is pushed to the `main` branch.
2.  **Push** the container image to the Azure Container Registry (ACR).
3.  **Deploy** the new version of the application to your *existing* Kubernetes cluster by:
    *   Running database migrations.
    *   Applying the Kubernetes manifests (`deployment.yml`, `service.yml`, `ingress.yml`) to update the running application.

This pipeline **assumes that the underlying infrastructure already exists.**

### Infrastructure as Code (IaC)'s Responsibility: Environment Provisioning

Provisioning the cloud infrastructure itself is a separate, critical task that should be automated using **Infrastructure as Code (IaC)** tools. This ensures your environments are consistent, repeatable, and version-controlled.

You should use a tool like **Terraform** or **Azure Bicep** to define and manage your cloud resources. The pipeline does not and should not do this.

#### Example Resources to Manage with IaC:

Your IaC scripts would be responsible for creating and configuring resources such as:

*   **Resource Group**: The container for all your Azure resources.
*   **Azure Kubernetes Service (AKS) Cluster**: The managed Kubernetes environment where your application runs.
    *   This includes configuring node pools, networking (CNI), and integrations (e.g., with ACR).
*   **Azure Container Registry (ACR)**: To store your Docker images.
*   **Azure Database for PostgreSQL**: Your primary database.
    *   This includes setting up firewall rules and user access.
*   **Azure Cache for Redis**: For session storage and caching.
*   **Azure Key Vault (Recommended)**: For securely storing and managing secrets like database passwords and API keys. This is the recommended best practice over using pipeline variables for sensitive information.
    *   **Note**: To use this, your AKS cluster must be configured with the **Azure Key Vault Provider for Secrets Store CSI Driver**. This allows you to mount secrets from Key Vault directly into your pods. You will also need to configure the correct **RBAC permissions** (e.g., via a Managed Identity) to allow AKS to access the Key Vault instance.
*   **Public IP Addresses and DNS Zones**: For exposing your application to the internet.

### Deployment Strategy: Declarative Apply with Prune

The pipeline uses a declarative deployment strategy with `kubectl apply --prune`. This is a best practice that ensures the state of the Kubernetes cluster accurately reflects the state of the configuration files in this directory.

**How it Works:**
*   The `kubectl apply -f <directory>` command ensures all resources defined in the manifests are created or updated.
*   The `--prune` flag automatically deletes any resources from the cluster that have been removed from the source manifests in Git.
*   A label selector (`-l app.kubernetes.io/name=healthapp`) is used to ensure that the `--prune` command only considers objects with that specific label, preventing it from accidentally deleting other resources.

This approach prevents orphaned resources and configuration drift, making the deployment process more reliable and predictable.

### Summary

| Task                                  | Tool                                                              | Responsibility                                                                    |
| ------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| **Provisioning Infrastructure**       | **Terraform, Azure Bicep** (IaC)                                  | Create, configure, and manage the cloud resources (AKS, Database, ACR, etc.).     |
| **Deploying the Application**         | **Azure Pipelines** (CI/CD)                                       | Build the application code, push the Docker image, and deploy it to the cluster.  |

To answer the original question: **No, the pipeline alone is not sufficient to set up the entire environment.** You need to adopt an IaC tool like Terraform or Bicep to do the full deployment of your infrastructure. Once that infrastructure is in place, this pipeline will handle the continuous deployment of your application onto it.
