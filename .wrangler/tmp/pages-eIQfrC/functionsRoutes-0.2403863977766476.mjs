import { onRequestGet as __api_summary_js_onRequestGet } from "C:\\Code\\1-JAVASCRIPT\\22-VITE\\savings-app\\functions\\api\\summary.js"

export const routes = [
    {
      routePath: "/api/summary",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_summary_js_onRequestGet],
    },
  ]