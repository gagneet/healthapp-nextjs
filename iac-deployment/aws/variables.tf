variable "aws_region" {
  description = "The AWS region to deploy the infrastructure in."
  type        = string
  default     = "us-east-1"
}

variable "instance_type" {
  description = "The EC2 instance type."
  type        = string
  default     = "t3.medium"
}

variable "ami_id" {
  description = "The AMI for the EC2 instance (Ubuntu 22.04). If not set, the latest Ubuntu 22.04 AMI will be fetched dynamically."
  type        = string
  default     = ""
}

variable "db_instance_class" {
  description = "The RDS instance class."
  type        = string
  default     = "db.t3.micro"
}

variable "postgres_engine_version" {
  description = "The PostgreSQL engine version."
  type        = string
  default     = "14.2"
}

variable "db_allocated_storage" {
  description = "The allocated storage for the RDS instance."
  type        = number
  default     = 20
}

variable "db_name" {
  description = "The name of the database."
  type        = string
  default     = "healthapp_prod"
}

variable "db_user" {
  description = "The master username for the database."
  type        = string
  default     = "healthapp_user"
}

variable "db_password" {
  description = "The master password for the database."
  type        = string
  sensitive   = true
}

variable "redis_node_type" {
  description = "The ElastiCache for Redis node type."
  type        = string
  default     = "cache.t3.micro"
}

variable "redis_engine_version" {
  description = "The Redis engine version."
  type        = string
  default     = "7.0"
}

variable "key_name" {
  description = "The name of the EC2 key pair to use for SSH access."
  type        = string
}

variable "ssh_access_cidr" {
  description = "The CIDR block to allow SSH access from. For security, this should be a specific IP range."
  type        = list(string)
  default     = ["0.0.0.0/0"]
}
