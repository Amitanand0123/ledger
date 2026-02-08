// Environment variable validation (HireMaze style - manual validation)
// Based on hiremaze-api-commons approach

interface RequiredEnvVars {
  DATABASE_URL: string;
  JWT_SECRET: string;
  PORT?: string;
  NODE_ENV?: string;
  AWS_ACCESS_KEY_ID?: string;
  AWS_SECRET_ACCESS_KEY?: string;
  AWS_REGION?: string;
  AWS_S3_BUCKET_NAME?: string;
  AI_SERVICE_URL?: string;
  AI_SERVICE_API_KEY?: string;
  RESEND_API_KEY?: string;
  FRONTEND_URL?: string;
}

export const validateEnv = (): void => {
  const errors: string[] = [];

  // Required variables
  const required: (keyof RequiredEnvVars)[] = [
    'DATABASE_URL',
    'JWT_SECRET',
  ];

  for (const key of required) {
    if (!process.env[key]) {
      errors.push(`Missing required environment variable: ${key}`);
    }
  }

  // Validate DATABASE_URL format
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('postgresql://')) {
    errors.push('DATABASE_URL must be a valid PostgreSQL connection string starting with postgresql://');
  }

  // Validate JWT_SECRET length
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters long for security');
  }

  // Validate NODE_ENV
  const validEnvs = ['development', 'production', 'test'];
  if (process.env.NODE_ENV && !validEnvs.includes(process.env.NODE_ENV)) {
    errors.push(`NODE_ENV must be one of: ${validEnvs.join(', ')}`);
  }

  // Validate PORT if provided
  if (process.env.PORT && isNaN(Number(process.env.PORT))) {
    errors.push('PORT must be a valid number');
  }

  // Validate AWS configuration (all or none)
  const awsVars = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION', 'AWS_S3_BUCKET_NAME'];
  const awsProvided = awsVars.filter(key => process.env[key]);
  if (awsProvided.length > 0 && awsProvided.length < awsVars.length) {
    errors.push(`AWS configuration incomplete. Provide all of: ${awsVars.join(', ')} or none`);
  }

  // Set defaults
  if (!process.env.PORT) {
    process.env.PORT = '5000';
    console.log('ℹ️  PORT not set, defaulting to 5000');
  }

  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'development';
    console.log('ℹ️  NODE_ENV not set, defaulting to development');
  }

  if (!process.env.AWS_REGION && process.env.AWS_ACCESS_KEY_ID) {
    process.env.AWS_REGION = 'us-east-1';
    console.log('ℹ️  AWS_REGION not set, defaulting to us-east-1');
  }

  // Report errors
  if (errors.length > 0) {
    console.error('\n❌ Environment Variable Validation Failed:\n');
    errors.forEach(error => console.error(`   - ${error}`));
    console.error('\nPlease check your .env file and ensure all required variables are set.\n');
    process.exit(1);
  }

  console.log('✅ Environment variables validated successfully');
};

export const getEnvVar = (key: keyof RequiredEnvVars, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Environment variable ${key} is not set and no default value provided`);
  }
  return value;
};
