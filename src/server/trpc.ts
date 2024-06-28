import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import { createClient, AsyncResult } from 'celery-node';

const t = initTRPC.create();
export const router = t.router;
export const publicProcedure = t.procedure;

// Initialize Celery client
const celeryClient = createClient(
  process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
  process.env.REDIS_URL || 'redis://localhost:6379'
);

// Define input and output types
const QuestionInput = z.object({
  conversationId: z.string(),
  question: z.string(),
  messages: z.array(z.object({ text: z.string(), isUser: z.boolean() }))
});

const TaskStatusInput = z.object({ taskId: z.string() });

export const appRouter = router({
  processQuestion: publicProcedure
    .input(QuestionInput)
    .mutation(async ({ input }) => {
      const { conversationId, question } = input;
      console.log(`Processing question for conversation ${conversationId}: ${question}`);
      
      const task = celeryClient.createTask('tasks.question_task');
      const asyncResult = await task.applyAsync([conversationId, question]);
      
      return { status: 200, taskId: asyncResult.taskId };
    }),

  checkTaskStatus: publicProcedure
    .input(TaskStatusInput)
    .query(async ({ input }) => {
      const { taskId } = input;
      const asyncResult: AsyncResult = celeryClient.asyncResult(taskId);
      const status = await asyncResult.status();
      
      switch (status) {
        case 'SUCCESS':
          const result = await asyncResult.get();
          return { status: 'completed', result };
        case 'FAILURE':
          return { status: 'failed', error: 'Task failed' };
        default:
          return { status: 'pending' };
      }
    }),
});

export type AppRouter = typeof appRouter;