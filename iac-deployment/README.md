# Infrastructure as Code (IaC) for HealthApp Deployment

This directory contains the Infrastructure as Code (IaC) scripts to deploy the HealthApp application on both AWS and Azure. The scripts use Terraform for infrastructure provisioning and Ansible for configuration management and application deployment.

## Prerequisites

Before you begin, ensure you have the following installed:

- [Terraform](https://learn.hashicorp.com/tutorials/terraform/install-cli)
- [Ansible](https://docs.ansible.com/ansible/latest/installation_guide/intro_installation.html)
- An AWS account with the [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html) configured.
- An Azure account with the [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli) configured.
- A Docker Hub account to store the application's Docker image.

## Directory Structure

The `iac-deployment` directory is organized as follows:

- `aws/`: Contains the Terraform scripts for provisioning the AWS infrastructure.
- `azure/`: Contains the Terraform scripts for provisioning the Azure infrastructure.
- `common/`: Contains the common Ansible playbooks for deploying the application.

## Deployment Steps

### 1. Build and Push the Docker Image

Before deploying the application, you need to build the Docker image and push it to a Docker registry (e.g., Docker Hub).

1.  Navigate to the root of the project.
2.  Build the production Docker image:
    ```bash
    docker build -t your_docker_hub_username/healthapp:latest -f docker/Dockerfile.production .
    ```
3.  Push the image to Docker Hub:
    ```bash
    docker push your_docker_hub_username/healthapp:latest
    ```

### 2. AWS Deployment

#### a. Provision the Infrastructure

1.  Navigate to the `iac-deployment/aws` directory.
2.  Create a `terraform.tfvars` file and provide values for the variables defined in `variables.tf`. At a minimum, you need to provide `db_password` and `key_name`.
    ```tfvars
    db_password = "your_secure_db_password"
    key_name    = "your_ec2_key_pair_name"
    ```
3.  Initialize Terraform:
    ```bash
    terraform init
    ```
4.  Apply the Terraform configuration:
    ```bash
    terraform apply
    ```
    Terraform will provision the necessary AWS resources and output the public IP of the EC2 instance, the RDS endpoint, and the Redis endpoint.

#### b. Deploy the Application

1.  Navigate to the `iac-deployment/common` directory.
2.  Update the `inventory/hosts` file with the public IP of the EC2 instance from the Terraform output.
    ```ini
    [webservers]
    your_ec2_public_ip
    ```
3.  Run the Ansible playbook to deploy the application. You will need to pass the database and Redis details as extra variables.
    ```bash
    ansible-playbook playbooks/deploy-app.yml -i inventory/hosts \
      -e "db_host='your_rds_endpoint'" \
      -e "db_password='your_secure_db_password'" \
      -e "redis_host='your_redis_endpoint'" \
      -e "docker_image='your_docker_hub_username/healthapp:latest'"
    ```

### 3. Azure Deployment

#### a. Provision the Infrastructure

1.  Navigate to the `iac-deployment/azure` directory.
2.  Create a `terraform.tfvars` file and provide values for the variables defined in `variables.tf`. At a minimum, you need to provide `admin_password` and `db_password`.
    ```tfvars
    admin_password = "your_secure_vm_password"
    db_password    = "your_secure_db_password"
    ```
3.  Initialize Terraform:
    ```bash
    terraform init
    ```
4.  Apply the Terraform configuration:
    ```bash
    terraform apply
    ```
    Terraform will provision the necessary Azure resources and output the public IP of the VM, the PostgreSQL server name, and the Redis cache details.

#### b. Deploy the Application

1.  Navigate to the `iac-deployment/common` directory.
2.  Update the `inventory/hosts` file with the public IP of the VM from the Terraform output.
    ```ini
    [webservers]
    your_vm_public_ip
    ```
3.  Run the Ansible playbook to deploy the application. You will need to pass the database and Redis details as extra variables.
    ```bash
    ansible-playbook playbooks/deploy-app.yml -i inventory/hosts \
      -e "db_host='your_postgresql_server_name.postgres.database.azure.com'" \
      -e "db_password='your_secure_db_password'" \
      -e "redis_host='your_redis_cache_name.redis.cache.windows.net'" \
      -e "redis_password='your_redis_primary_key'" \
      -e "docker_image='your_docker_hub_username/healthapp:latest'"
    ```

## Configuration

-   **Terraform**: You can customize the infrastructure by modifying the variables in the `variables.tf` files in the `aws` and `azure` directories.
-   **Ansible**: You can customize the application deployment by modifying the variables in the `iac-deployment/common/playbooks/deploy-app.yml` file or by passing them as extra variables to the `ansible-playbook` command.
