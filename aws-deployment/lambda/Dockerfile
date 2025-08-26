FROM public.ecr.aws/lambda/nodejs:18

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src/ ./

# Build TypeScript
RUN npm run build

# Remove source maps and TypeScript files
RUN find . -name "*.map" -delete && find . -name "*.ts" -delete

# Set the CMD to your handler
CMD [ "index.lambdaHandler" ]
