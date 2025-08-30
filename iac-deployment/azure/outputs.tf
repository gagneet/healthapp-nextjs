output "vm_public_ip" {
  description = "The public IP address of the virtual machine."
  value       = azurerm_public_ip.main.ip_address
}

output "postgresql_server_name" {
  description = "The fully qualified domain name of the PostgreSQL server."
  value       = azurerm_postgresql_server.main.fqdn
}

output "redis_cache_name" {
  description = "The name of the Redis cache."
  value       = azurerm_redis_cache.main.name
}

output "redis_primary_key" {
  description = "The primary key for the Redis cache."
  value       = azurerm_redis_cache.main.primary_access_key
  sensitive   = true
}
