import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("sidebar-demo", "routes/sidebar-demo.tsx"),
  route("research/credits", "routes/research-credits.tsx"),
  route("review/credits", "routes/review-credits.tsx"),
] satisfies RouteConfig;
