export function validateToken(request: Request): { valid: boolean } {
  const header = request.headers.get("Authorization");
  const token = header?.replace("Bearer ", "");
  return { valid: token === process.env.AUTH_TOKEN };
}
