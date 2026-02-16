import type { Handler } from 'aws-lambda';

export const handler: Handler = async (event, context) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Hello from Saad-Lambda in TypeScript!',
      input: event,
    }),
  };
};
