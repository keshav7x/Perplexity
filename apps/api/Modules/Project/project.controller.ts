import type { Response } from "express";
import { ApiResponse } from "@api/shared/Response";
import { asyncHandler } from "@api/shared/asyncHandler";
import type { AuthRequest } from "@api/shared/auth";
import { ProjectService } from "./project.service";
import { ConversationService } from "@modules/conversation/conversation.service";
import {
  conversationListQuerySchema,
} from "@modules/conversation/conversation.validation";
import {
  createProjectSchema,
  projectIdParamSchema,
  projectListQuerySchema,
  updateProjectSchema,
} from "./project.validation";

export class ProjectController {
  constructor(
    private readonly projectService: ProjectService = new ProjectService(),
    private readonly conversationService: ConversationService = new ConversationService(),
  ) {}

  createProject = asyncHandler(async (req: AuthRequest, res: Response) => {
    const body = createProjectSchema.parse(req.body);

    const project = await this.projectService.createProject({
      ownerId: req.user.id,
      title: body.title,
      description: body.description,
    });

    return ApiResponse.success(res, 201, "Project created successfully", project);
  });

  listProjects = asyncHandler(async (req: AuthRequest, res: Response) => {
    const query = projectListQuerySchema.parse(req.query);

    const result = await this.projectService.getProjects({
      ownerId: req.user.id,
      limit: query.limit,
      cursor: query.cursor,
    });

    return ApiResponse.success(res, 200, "Projects fetched successfully", result);
  });

  getProject = asyncHandler(async (req: AuthRequest, res: Response) => {
    const params = projectIdParamSchema.parse(req.params);

    const project = await this.projectService.getProject({
      projectId: params.projectId,
      ownerId: req.user.id,
    });

    return ApiResponse.success(res, 200, "Project fetched successfully", project);
  });

  /** GET /api/v1/projects/:projectId/conversations */
  listProjectConversations = asyncHandler(
    async (req: AuthRequest, res: Response) => {
      const params = projectIdParamSchema.parse(req.params);
      const query = conversationListQuerySchema.parse(req.query);

      // Ensures the project belongs to this user before listing.
      await this.projectService.getProject({
        projectId: params.projectId,
        ownerId: req.user.id,
      });

      const result = await this.conversationService.getConversations({
        ownerId: req.user.id,
        limit: query.limit,
        cursor: query.cursor,
        includeArchived: query.includeArchived,
        projectId: params.projectId,
      });

      return ApiResponse.success(
        res,
        200,
        "Project conversations fetched successfully",
        result,
      );
    },
  );

  updateProject = asyncHandler(async (req: AuthRequest, res: Response) => {
    const params = projectIdParamSchema.parse(req.params);
    const body = updateProjectSchema.parse(req.body);

    const project = await this.projectService.updateProject({
      projectId: params.projectId,
      ownerId: req.user.id,
      title: body.title,
      description: body.description,
    });

    return ApiResponse.success(res, 200, "Project updated successfully", project);
  });

  deleteProject = asyncHandler(async (req: AuthRequest, res: Response) => {
    const params = projectIdParamSchema.parse(req.params);

    const deleted = await this.projectService.deleteProject({
      projectId: params.projectId,
      ownerId: req.user.id,
    });

    return ApiResponse.success(res, 200, "Project deleted successfully", deleted);
  });
}
