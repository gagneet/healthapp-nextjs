output "ec2_public_ip" {
  description = "The public IP address of the EC2 instance."
  value       = aws_instance.web.public_ip
}

output "rds_endpoint" {
  description = "The endpoint of the RDS instance."
  value       = aws_db_instance.main.endpoint
}

output "redis_endpoint" {
  description = "The endpoint of the ElastiCache Redis cluster."
  value       = aws_elasticache_cluster.main.cache_nodes[0].address
}
