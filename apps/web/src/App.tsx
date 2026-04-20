import { Routes, Route, useLocation } from "react-router-dom";
import { Layout } from "./app/layout";
import { Home } from "./app/page";
import { SkillDetail } from "./app/skills/[name]/page";
import { NotFound } from "./app/not-found";
import Template from "./app/template";

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <Template key={location.pathname}>
      <Routes location={location}>
        <Route path="/" element={<Home />} />
        <Route path="/skills/:name" element={<SkillDetail />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Template>
  );
}

export default function App() {
  return (
    <Layout>
      <AnimatedRoutes />
    </Layout>
  );
}
