import { defineRailway, github, project, service } from "railway/iac";
// This repository manages only its own resources in the environment. Other
// repositories export their own partial name.
// See https://docs.railway.com/infrastructure-as-code#multi-repo-projects
export const partial = "finflo";
export default defineRailway(() => {
  const finflo = service("finflo", {
    source: github("ArshadNawazBaig/calculator", { branch: "main", checkSuites: false }),
    build: "npm run build",
    start: "npm run start",
    healthcheck: "/api/health",
    healthcheckTimeout: 120,
    replicas: { "iad": 1 },
  });

  return project("finflo", {
    variables: { managed: false },
    resources: [finflo],
  });
});
