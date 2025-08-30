variable "azure_location" {
  description = "The Azure location to deploy the infrastructure in."
  type        = string
  default     = "East US"
}

variable "vm_size" {
  description = "The size of the virtual machine."
  type        = string
  default     = "Standard_B2s"
}

variable "admin_username" {
  description = "The admin username for the VM."
  type        = string
  default     = "ubuntuadmin"
}

variable "ssh_public_key" {
  description = "The public SSH key to use for authenticating to the VM."
  type        = string
}

variable "db_sku_name" {
  description = "The SKU name for the PostgreSQL server."
  type        = string
  default     = "B_Gen5_1"
}

variable "db_storage_mb" {
  description = "The storage for the PostgreSQL server."
  type        = number
  default     = 5120
}

variable "db_version" {
  description = "The version of PostgreSQL."
  type        = string
  default     = "11"
}

variable "db_name" {
  description = "The name of the database."
  type        = string
  default     = "healthapp_prod"
}

variable "db_user" {
  description = "The admin username for the database."
  type        = string
  default     = "healthapp_user"
}

variable "db_password" {
  description = "The admin password for the database."
  type        = string
  sensitive   = true
}

variable "redis_sku_name" {
  description = "The SKU name for the Redis cache."
  type        = string
  default     = "Basic"
}

variable "redis_family" {
  description = "The family for the Redis cache."
  type        = string
  default     = "C"
}

variable "redis_capacity" {
  description = "The capacity for the Redis cache."
  type        = number
  default     = 0
}
