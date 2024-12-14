import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function SettingsTab() {
  return (
    <div className="p-8">
      <Card className="max-w-2xl mx-auto">
        <div className="p-6 space-y-6">
          <h2 className="text-2xl font-bold mb-6">Settings</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="darkMode">Dark Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Enable dark mode for better viewing at night
                </p>
              </div>
              <Switch id="darkMode" />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notifications">Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive updates about your contacts
                </p>
              </div>
              <Switch id="notifications" />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="autoScan">Auto Scan</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically process cards after upload
                </p>
              </div>
              <Switch id="autoScan" />
            </div>
          </div>

          <div className="pt-6 border-t">
            <Button variant="outline" className="w-full">
              Sign Out
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default SettingsTab 