import { Route, Routes } from 'react-router-dom';

import ProjectMembershipCreatePage from './CreatePage/ProjectMembershipCreatePage';

const ProjectMembershipRoutes = () => (
  <Routes>
    <Route path="/:id/edit/:pmId" element={<ProjectMembershipCreatePage />} />
    <Route path="/create/:id" element={<ProjectMembershipCreatePage />} />
  </Routes>
);

export default ProjectMembershipRoutes;
