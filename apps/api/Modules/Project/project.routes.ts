import { Router } from "express";
import { requireAuth } from "@api/shared/auth";
import { ProjectController } from "./project.controller";

const projectRouter = Router();
const projectController = new ProjectController();

projectRouter.use(requireAuth);

projectRouter.post("/", projectController.createProject);
projectRouter.get("/", projectController.listProjects);
projectRouter.get("/:projectId", projectController.getProject);
projectRouter.get(
  "/:projectId/conversations",
  projectController.listProjectConversations,
);
projectRouter.patch("/:projectId", projectController.updateProject);
projectRouter.delete("/:projectId", projectController.deleteProject);

export default projectRouter;
