import type { AutomationWorkflow, WorkflowStep, WorkflowEnrollment } from '@church-growth-os/shared'

// ============================================================
// WORKFLOW CONTEXT
// ============================================================

export interface WorkflowContext {
  churchId: string
  entityId: string
  entityType: 'member' | 'visitor'
  entityData: Record<string, unknown>
  workflowId: string
  enrollmentId: string
  variables: Record<string, unknown>
}

// ============================================================
// STEP EXECUTOR INTERFACE
// ============================================================

export interface StepExecutionResult {
  success: boolean
  output?: Record<string, unknown>
  error?: string
  nextStepId?: string | null
}

export interface IStepExecutor {
  readonly stepType: string
  execute(step: WorkflowStep, context: WorkflowContext): Promise<StepExecutionResult>
}

// ============================================================
// WORKFLOW ENGINE
// ============================================================

export type EnrollmentStore = {
  getEnrollment(id: string): Promise<WorkflowEnrollment | null>
  updateEnrollment(id: string, data: Partial<WorkflowEnrollment>): Promise<void>
  createEnrollment(data: Omit<WorkflowEnrollment, 'id'>): Promise<string>
}

export type WorkflowStore = {
  getWorkflow(id: string): Promise<AutomationWorkflow | null>
  getActiveWorkflowsByChurch(churchId: string): Promise<AutomationWorkflow[]>
}

export class WorkflowEngine {
  private readonly executors = new Map<string, IStepExecutor>()

  constructor(
    private readonly workflowStore: WorkflowStore,
    private readonly enrollmentStore: EnrollmentStore
  ) {}

  registerExecutor(executor: IStepExecutor): void {
    this.executors.set(executor.stepType, executor)
  }

  async enroll(
    churchId: string,
    workflowId: string,
    entityId: string,
    entityType: 'member' | 'visitor',
    entityData: Record<string, unknown>
  ): Promise<string> {
    const workflow = await this.workflowStore.getWorkflow(workflowId)
    if (!workflow || !workflow.isActive) {
      throw new Error(`Workflow ${workflowId} not found or inactive`)
    }

    const firstStep = workflow.steps[0]
    if (!firstStep) throw new Error('Workflow has no steps')

    const now = new Date()
    const enrollmentId = await this.enrollmentStore.createEnrollment({
      churchId,
      workflowId,
      entityId,
      entityType,
      currentStepId: firstStep.id,
      status: 'active',
      nextActionAt: { seconds: Math.floor(now.getTime() / 1000), nanoseconds: 0, toDate: () => now },
      history: [],
      enrolledAt: { seconds: Math.floor(now.getTime() / 1000), nanoseconds: 0, toDate: () => now },
    })

    return enrollmentId
  }

  async advance(enrollmentId: string, entityData: Record<string, unknown>): Promise<void> {
    const enrollment = await this.enrollmentStore.getEnrollment(enrollmentId)
    if (!enrollment || enrollment.status !== 'active') return

    const workflow = await this.workflowStore.getWorkflow(enrollment.workflowId)
    if (!workflow) return

    const currentStep = workflow.steps.find((s) => s.id === enrollment.currentStepId)
    if (!currentStep) return

    const executor = this.executors.get(currentStep.type)
    if (!executor) {
      console.error(`No executor registered for step type: ${currentStep.type}`)
      return
    }

    const context: WorkflowContext = {
      churchId: enrollment.churchId,
      entityId: enrollment.entityId,
      entityType: enrollment.entityType,
      entityData,
      workflowId: enrollment.workflowId,
      enrollmentId,
      variables: {},
    }

    const result = await executor.execute(currentStep, context)

    const historyEntry = {
      stepId: currentStep.id,
      executedAt: {
        seconds: Math.floor(Date.now() / 1000),
        nanoseconds: 0,
        toDate: () => new Date(),
      },
      result: result.success ? 'success' : result.error ?? 'failed',
    }

    if (result.nextStepId === null || !result.nextStepId) {
      // Workflow complete
      await this.enrollmentStore.updateEnrollment(enrollmentId, {
        status: 'completed',
        history: [...enrollment.history, historyEntry],
      })
    } else {
      const nextStep = workflow.steps.find((s) => s.id === result.nextStepId)
      const nextActionAt = nextStep?.type === 'wait'
        ? this.computeWaitUntil(nextStep.config as { duration: number; unit: string })
        : new Date()

      await this.enrollmentStore.updateEnrollment(enrollmentId, {
        currentStepId: result.nextStepId,
        nextActionAt: {
          seconds: Math.floor(nextActionAt.getTime() / 1000),
          nanoseconds: 0,
          toDate: () => nextActionAt,
        },
        history: [...enrollment.history, historyEntry],
      })
    }
  }

  private computeWaitUntil(config: { duration: number; unit: string }): Date {
    const ms = {
      minutes: 60 * 1000,
      hours: 60 * 60 * 1000,
      days: 24 * 60 * 60 * 1000,
      weeks: 7 * 24 * 60 * 60 * 1000,
    }[config.unit] ?? 60 * 1000

    return new Date(Date.now() + config.duration * ms)
  }
}
