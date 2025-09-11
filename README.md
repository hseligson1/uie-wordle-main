
# UIE Wordle - HubSpot Integration

A fully functional Wordle game clone built as a HubSpot UI Extension, demonstrating modern serverless architecture with external API integration.

## Overview

This project showcases how to build interactive games within HubSpot's CRM using UI Extensions. Originally built with [HubSpot's deprecated serverless functions](https://github.com/hubspotdev/uie-wordle/tree/main), it has been migrated to use external AWS Lambda functions, demonstrating best practices for the HubSpot Developer Platform 2025.2.

### Features

- **Interactive Wordle gameplay** directly within HubSpot contact records
- **Personalized user experience** with HubSpot context integration  
- **External API integration** using `hubspot.fetch()` for random word generation
- **Robust error handling** and fallback mechanisms
- **CORS-compliant** architecture for browser-based API calls
- **Scalable serverless infrastructure** on AWS Lambda

## Architecture

### HubSpot Platform 2025.2 Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   HubSpot CRM   │    │   API Gateway    │    │  AWS Lambda     │
│                 │    │                  │    │                 │
│  UI Extension   │───▶│  Public HTTPS    │───▶│ Word Generator  │
│ (React/TSX)     │    │   Endpoint       │    │   Function      │
│                 │    │                 │    │                 │
│ hubspot.fetch() │◀───│ CORS Headers     │◀───│ JSON Response   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Key Components

- **Frontend**: React components using HubSpot's UI Extensions framework
- **API Layer**: AWS API Gateway with CORS configuration
- **Backend**: AWS Lambda function with fallback word generation
- **Integration**: HubSpot's `hubspot.fetch()` for external API calls

## Quick Start

### Prerequisites

- Node.js 18+ (required for HubSpot CLI v7.6.0+)
- HubSpot Developer Account with CRM Development Tools access
- AWS Account (for Lambda function deployment)
- HubSpot CLI installed: `npm install -g @hubspot/cli@latest`

### Installation

1. **Clone and setup the project**:
   ```bash
   git clone <repository-url>
   cd uie-wordle
   npm install
   ```

2. **Authenticate with HubSpot**:
   ```bash
   hs account auth
   ```

3. **Initialize the project**:
   ```bash
   hs project dev
   ```

### Lambda Function Setup

1. **Create AWS Lambda function**:
   - Function name: `lambdaRandomWord`  
   - Runtime: Node.js 22.x
   - Handler: `index.handler`
   - Timeout: 10 seconds

2. **Deploy the Lambda code** (see `/lambda/index.mjs`)

3. **Create API Gateway**:
   - REST API with `/getRandomWord` resource
   - Enable Lambda Proxy Integration
   - Deploy to `prod` stage

4. **Update configuration**:
   ```javascript
   // In Wordle.tsx
   const LAMBDA_CONFIG = {
     endpoint: 'https://your-api-id.execute-api.region.amazonaws.com/prod/getRandomWord'
   };
   ```

5. **Update app permissions**:
   ```json
   // In app-hsmeta.json
   {
     "config": {
       "fetch": {
         "permittedUrls": [
           "https://your-api-id.execute-api.region.amazonaws.com/prod/getRandomWord"
         ]
       }
     }
   }
   ```

## Development

### Local Development

```bash
# Start local development server
hs project dev

# In another terminal, test your Lambda function
curl "https://your-api-endpoint.amazonaws.com/prod/getRandomWord?difficulty=normal"
```

### Project Structure

```
src/
├── app/
│   ├── cards/
│   │   ├── Wordle.tsx              # Main game component
│   │   └── wordle-card-hsmeta.json # Card configuration
│   ├── components/
│   │   ├── GameBoard.jsx           # Game logic and UI
│   │   ├── GameInstructions.jsx    # Help text
│   │   └── [other components]
│   └── app-hsmeta.json             # App configuration
├── lambda/
│   └── index.mjs                   # AWS Lambda function
└── hsproject.json                  # HubSpot project config
```

### Key Configuration Files

**`hsproject.json`**:
```json
{
  "name": "uie-wordle",
  "platformVersion": "2025.2",
  "srcDir": "src"
}
```

**`app-hsmeta.json`**:
```json
{
  "uid": "uie-wordle-app",
  "type": "app",
  "distribution": "private",
  "auth": { "type": "static" },
  "config": {
    "fetch": {
      "permittedUrls": ["https://your-lambda-endpoint.amazonaws.com/prod/getRandomWord"]
    }
  }
}
```

## Testing

### 4-Layer Testing Approach

1. **Layer 1 - Lambda Function Testing**:
   ```bash
   # Test directly in AWS Lambda console with test events
   ```

2. **Layer 2 - API Gateway Integration**:
   ```bash
   # Test in API Gateway console using TEST feature
   ```

3. **Layer 3 - HTTP API Testing**:
   ```bash
   curl "https://your-api-endpoint.amazonaws.com/prod/getRandomWord?difficulty=normal"
   ```

4. **Layer 4 - HubSpot Integration**:
   ```bash
   # Test in HubSpot development environment
   hs project dev
   ```

### Common Test Scenarios

```bash
# Test GET request
curl "https://your-endpoint.amazonaws.com/prod/getRandomWord?difficulty=normal"

# Test CORS preflight
curl -X OPTIONS "https://your-endpoint.amazonaws.com/prod/getRandomWord" \
  -H "Origin: https://app.hubspot.com" \
  -H "Access-Control-Request-Method: GET" \
  -v

# Test error handling  
curl "https://your-endpoint.amazonaws.com/prod/nonexistent"
```

## Deployment

### Deploy to HubSpot

```bash
# Deploy to HubSpot
hs project upload

# Check deployment status
hs project info
```

### AWS Lambda Deployment

1. **Update function code** in AWS Lambda console
2. **Deploy API Gateway** changes to prod stage  
3. **Test public endpoint** before deploying to HubSpot

## Migration Notes

### From HubSpot Serverless Functions (2023.2) to External Lambda (2025.2)

**Key Changes**:
- Removed `src/app/app.functions/` directory
- Replaced `runServerless()` calls with `hubspot.fetch()`  
- Added external Lambda function infrastructure
- Updated error handling for HTTP responses
- Added CORS configuration requirements

**Before (2023.2)**:
```javascript
const result = await runServerless({
  name: 'getRandomWord',
  parameters: { difficulty: 'normal' }
});
```

**After (2025.2)**:
```javascript
const response = await hubspot.fetch(
  'https://lambda-endpoint.amazonaws.com/prod/getRandomWord?difficulty=normal',
  { method: 'GET', headers: { 'Content-Type': 'application/json' }}
);
const result = await response.json();
```

## Troubleshooting

### Common Issues

**400 Bad Request Errors**:
- Check CloudWatch logs: `/aws/lambda/lambdaRandomWord`
- Verify request format matches Lambda expectations
- Ensure CORS headers are properly configured

**CORS Errors**:
- Verify `permittedUrls` in `app-hsmeta.json`
- Check Lambda function returns proper CORS headers
- Test with browser developer tools network tab

**Function Timeout**:
- Increase Lambda timeout to 10 seconds
- Add proper fallback mechanisms for external API calls
- Check external API response times

**Deployment Issues**:
- Verify HubSpot CLI version: `hs --version` (should be 7.6.0+)
- Check Node.js version: `node --version` (should be 18+)
- Ensure proper authentication: `hs account info`

### Debug Mode

For debugging API requests, deploy the debug version of the Lambda function that logs all incoming requests:

```javascript
console.log('Full event object:', JSON.stringify(event, null, 2));
```

Then check CloudWatch logs to see exactly what HubSpot is sending.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Test all 4 layers of the application
4. Submit a pull request with test results

## License

This project is licensed under the MIT License.

## Acknowledgments

- Built using HubSpot's v2025.2 of the Developer Platform
- Inspired by the original Wordle game by Josh Wardle and Legacy app card by Bree Hall
- Demonstrates modern serverless architecture patterns
- Shows migration path from deprecated HubSpot serverless functions to external hosting

## Support

For issues related to:
- **HubSpot platform**: Check [HubSpot Developer Documentation](https://developers.hubspot.com/)
- **AWS Lambda**: Refer to [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)
- **This project**: Open an issue in the repository

---

**Note**: This app demonstrates the migration from HubSpot's deprecated serverless functions to external hosting. The architecture shown here represents best practices for HubSpot Developer Platform 2025.2 and beyond.

### Note: Using the Wordle Card

This app card allows users to play the [Wordle game](https://www.nytimes.com/games/wordle/index.html), as popularized by the [New York Times Games](https://www.nytimes.com/games). Guess a mystery word within five guesses to win the same. After each guess, each character in your word will be highlighted to indicate how close you are to guessing the word.

If the letter is highlighted in green, the letter is in the word and is in the correct spot. If the letter is highlighted in yellow, the letter is in the word but in the wrong spot. If the letter is not highlighted, the letter is not in the word.

https://github.com/user-attachments/assets/109827c8-bf7b-43d8-b27e-45cbee02c25e
