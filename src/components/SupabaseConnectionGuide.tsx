
import React from 'react';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

const SupabaseConnectionGuide: React.FC = () => {
  const isConfigured = isSupabaseConfigured();

  if (isConfigured) {
    return null;
  }

  return (
    <Card className="max-w-3xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Supabase Connection Required</CardTitle>
        <CardDescription>
          Your Supabase credentials are not properly configured.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <AlertTitle>Missing Environment Variables</AlertTitle>
          <AlertDescription>
            The application requires Supabase URL and Anonymous Key to function properly.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <h3 className="text-lg font-medium">How to Configure Supabase</h3>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              Create a <code>.env.local</code> file in the root of your project.
            </li>
            <li>
              Add the following variables to the file:
              <pre className="bg-muted p-2 rounded-md mt-2 overflow-x-auto">
                <code>
                  VITE_SUPABASE_URL=your_supabase_url{'\n'}
                  VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
                </code>
              </pre>
            </li>
            <li>
              Get these values from your Supabase project dashboard under "Project Settings" &gt; "API".
            </li>
            <li>
              Restart your development server after adding these variables.
            </li>
          </ol>
        </div>

        <div className="bg-muted p-4 rounded-md">
          <h4 className="font-medium">Security Note</h4>
          <p className="text-sm">
            The Anonymous Key is safe to include in client-side code, but ensure you set up proper Row Level Security (RLS) 
            in your Supabase project to control data access.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SupabaseConnectionGuide;
