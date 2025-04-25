# Setting Up Environment Variables on Vercel

This project requires certain environment variables to be set in your Vercel project settings to work correctly in production.

## Required Environment Variables

Set the following environment variables in your Vercel project:

| Variable | Example Value | Description |
|----------|--------------|-------------|
| `NEXT_PUBLIC_SUBGRAPH_URL` | `https://api.studio.thegraph.com/query/105196/vhackv2/version/latest` | The GraphQL endpoint for The Graph subgraph |

## Steps to Configure

1. Go to your project on Vercel dashboard
2. Click on "Settings" tab
3. Navigate to "Environment Variables" section
4. Add each of the required variables (make sure to select all environments: Production, Preview, and Development)
5. Click "Save" after adding each variable
6. Redeploy your project with "Redeploy" button from the Deployments tab

## Troubleshooting

If items still don't appear after setting environment variables:

1. **Verify Values**: Double-check that the environment variable values are correct
2. **Redeploy**: Make sure to redeploy your application after adding the variables
3. **Check Logs**: Review your Vercel Function logs for any errors
4. **Clear Cache**: Try clearing your browser cache or test in incognito mode

## Local Development

For local development, create a `.env.local` file in the root of your project with the same variables:

```
NEXT_PUBLIC_SUBGRAPH_URL=https://api.studio.thegraph.com/query/105196/vhackv2/version/latest
```

After creating this file, restart your development server with `yarn dev`. 