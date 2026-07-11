#!/usr/bin/env node
import { App } from 'aws-cdk-lib';
import { SaadApiStack } from '../lib/saad-api-stack';

const app = new App();

new SaadApiStack(app, 'SaadApiStack', {
  env: {
    account: '759166090310',
    region: 'us-east-1',
  },
});
