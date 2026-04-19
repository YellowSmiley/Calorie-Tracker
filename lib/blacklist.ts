type HeaderProvider = {
  get(name: string): string | null;
};

export function getClientIp(headers: HeaderProvider): string | null {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) {
      return first;
    }
  }

  const realIp = headers.get("x-real-ip");
  if (realIp?.trim()) {
    return realIp.trim();
  }

  return null;
}
