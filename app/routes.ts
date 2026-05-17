import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("sidebar-demo", "routes/sidebar-demo.tsx"),
] satisfies RouteConfig;
