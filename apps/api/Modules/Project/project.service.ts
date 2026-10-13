import { projectRepositoryClass } from "./project.repository";
import { db } from "@api/Database";

export class ProjectService {
  constructor(
    private readonly projectRepository: projectRepositoryClass = new projectRepositoryClass(
      db,
    ),
  ) {}

  createProject = async (data: {
    ownerId: number;
    title: string;
    description?: string;
  }) => {
    this.validateOwnerId(data.ownerId);

    const title = data.title.trim();
    if (!title) {
      throw new Error("Project title cannot be empty");
    }

    return await this.projectRepository.create({
      ownerId: data.ownerId,
      title: title.slice(0, 120),
      description: data.description?.trim() || undefined,
    });
  };

  getProjects = async (data: {
    ownerId: number;
    limit?: number;
    cursor?: string;
  }) => {
    this.validateOwnerId(data.ownerId);

    return await this.projectRepository.list({
      ownerId: data.ownerId,
      limit: data.limit,
      cursor: data.cursor,
    });
  };

  getProject = async (data: { projectId: number; ownerId: number }) => {
    this.validateProjectId(data.projectId);
    this.validateOwnerId(data.ownerId);

    const project = await this.projectRepository.getById({
      projectId: data.projectId,
      ownerId: data.ownerId,
    });

    if (!project) {
      throw new Error("Project not found");
    }

    return project;
  };

  updateProject = async (data: {
    projectId: number;
    ownerId: number;
    title?: string;
    description?: string | null;
  }) => {
    this.validateProjectId(data.projectId);
    this.validateOwnerId(data.ownerId);

    const title = data.title?.trim();

    const project = await this.projectRepository.update({
      projectId: data.projectId,
      ownerId: data.ownerId,
      title: title ? title.slice(0, 120) : undefined,
      description: data.description,
    });

    if (!project) {
      throw new Error("Project not found");
    }

    return project;
  };

  deleteProject = async (data: { projectId: number; ownerId: number }) => {
    this.validateProjectId(data.projectId);
    this.validateOwnerId(data.ownerId);

    const deleted = await this.projectRepository.delete({
      projectId: data.projectId,
      ownerId: data.ownerId,
    });

    if (!deleted) {
      throw new Error("Project not found");
    }

    return deleted;
  };

  private validateOwnerId = (ownerId: number) => {
    if (!Number.isInteger(ownerId) || ownerId <= 0) {
      throw new Error("Unauthorized access");
    }
  };

  private validateProjectId = (projectId: number) => {
    if (!Number.isInteger(projectId) || projectId <= 0) {
      throw new Error("Invalid project ID");
    }
  };
}
