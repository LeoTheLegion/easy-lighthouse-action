// This file exports a configuration object for the GitHub Action.

export const config = {
    environment: {
        NODE_ENV: process.env.NODE_ENV || 'development',
    },
    inputs: {
        exampleInput: {
            required: true,
            description: 'An example input for the action',
        },
    },
};