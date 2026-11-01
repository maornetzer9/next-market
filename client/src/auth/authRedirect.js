export function resolveLoginRedirect(role, returnLocation) {
  if (role === "Admin") return "/admin";

  const fromPath = returnLocation?.pathname;
  const canReturn = fromPath && fromPath !== "/login" && fromPath !== "/register";
  if (!canReturn) return "/";

  return `${fromPath}${returnLocation.search || ""}${returnLocation.hash || ""}`;
}
