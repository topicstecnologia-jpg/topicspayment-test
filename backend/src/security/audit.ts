interface SecurityEventDetails {
  category: string;
  action: string;
  metadata?: Record<string, unknown>;
}

export function logSecurityEvent({ category, action, metadata }: SecurityEventDetails) {
  const payload = {
    scope: "security",
    category,
    action,
    metadata,
    timestamp: new Date().toISOString()
  };

  console.warn(JSON.stringify(payload));
}
