"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Key, 
  Plus, 
  Copy, 
  Eye, 
  EyeOff, 
  Trash2, 
  Webhook,
  Globe,
  Shield 
} from "lucide-react";

export default function APIPage() {
  const [apiKeys, setApiKeys] = useState([
    {
      id: 1,
      name: "Production API Key",
      key: "gfi_prod_xxxxxxxxxxxxxxxxxxx",
      created: "2024-01-15",
      lastUsed: "2 hours ago",
      status: "active"
    },
    {
      id: 2,
      name: "Development Key",
      key: "gfi_dev_yyyyyyyyyyyyyyyyyyyy", 
      created: "2024-02-20",
      lastUsed: "1 day ago",
      status: "active"
    }
  ]);

  const [showKeys, setShowKeys] = useState<{[key: number]: boolean}>({});
  const [webhookUrl, setWebhookUrl] = useState("https://api.example.com/webhook");

  const toggleKeyVisibility = (keyId: number) => {
    setShowKeys(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // TODO: Add toast notification
  };

  const maskKey = (key: string) => {
    return key.substring(0, 12) + "x".repeat(key.length - 12);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">API Configuration</h2>
        <p className="text-muted-foreground">
          Manage API keys, webhooks, and integration settings
        </p>
      </div>

      <Separator />

      <div className="space-y-8">
        {/* API Keys Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              <h3 className="text-lg font-medium">API Keys</h3>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Generate New Key
            </Button>
          </div>
          
          <div className="space-y-3">
            {apiKeys.map((apiKey) => (
              <div key={apiKey.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium">{apiKey.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Created: {apiKey.created} • Last used: {apiKey.lastUsed}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm capitalize">{apiKey.status}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    value={showKeys[apiKey.id] ? apiKey.key : maskKey(apiKey.key)}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleKeyVisibility(apiKey.id)}
                  >
                    {showKeys[apiKey.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(apiKey.key)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Webhooks Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            <h3 className="text-lg font-medium">Webhooks</h3>
          </div>
          
          <div className="max-w-md space-y-4">
            <div className="space-y-2">
              <Label htmlFor="webhook-url">Webhook URL</Label>
              <div className="flex gap-2">
                <Input
                  id="webhook-url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://api.example.com/webhook"
                />
                <Button variant="outline">
                  Test
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Configure webhook endpoints to receive real-time notifications about events
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium">Event Types</h4>
            <div className="grid gap-2 md:grid-cols-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="rounded" />
                <span className="text-sm">Student Enrollment</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="rounded" />
                <span className="text-sm">Course Updates</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                <span className="text-sm">Grade Changes</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                <span className="text-sm">Faculty Changes</span>
              </label>
            </div>
          </div>
        </div>

        <Separator />

        {/* API Settings */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            <h3 className="text-lg font-medium">API Settings</h3>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Rate Limiting</h4>
                <Button variant="outline" size="sm">Configure</Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Current limit: 1000 requests per hour
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">CORS Settings</h4>
                <Button variant="outline" size="sm">Configure</Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Configure cross-origin resource sharing policies
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">API Documentation</h4>
                <Button variant="outline" size="sm">View Docs</Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Access comprehensive API documentation and examples
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Security Settings */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <h3 className="text-lg font-medium">Security Settings</h3>
          </div>
          
          <div className="space-y-3">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">IP Whitelisting</h4>
                  <p className="text-sm text-muted-foreground">
                    Restrict API access to specific IP addresses
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Configure
                </Button>
              </div>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">API Key Rotation</h4>
                  <p className="text-sm text-muted-foreground">
                    Automatically rotate API keys on schedule
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Enable
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}