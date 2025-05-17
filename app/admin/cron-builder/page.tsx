import { CronExpressionBuilder } from "@/components/admin/cron-expression-builder";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function CronBuilderPage() {
  return (
    <>
      <DashboardHeader
        heading="Cron Expression Builder"
        text="Use this tool to easily create cron expressions for scheduled tasks"
      />
      <div className=" px-4 md:px-6 py-10">
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>About Cron Expressions</CardTitle>
              <CardDescription>Understanding the cron syntax</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p>
                  Cron expressions are used to define when scheduled tasks
                  should run. A standard cron expression consists of five
                  fields:
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-4">Field</th>
                        <th className="text-left py-2 px-4">Values</th>
                        <th className="text-left py-2 px-4">
                          Special Characters
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium">Minutes</td>
                        <td className="py-2 px-4">0-59</td>
                        <td className="py-2 px-4">* , - /</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium">Hours</td>
                        <td className="py-2 px-4">0-23</td>
                        <td className="py-2 px-4">* , - /</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium">Day of Month</td>
                        <td className="py-2 px-4">1-31</td>
                        <td className="py-2 px-4">* , - / ?</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium">Month</td>
                        <td className="py-2 px-4">1-12</td>
                        <td className="py-2 px-4">* , - /</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-4 font-medium">Day of Week</td>
                        <td className="py-2 px-4">0-6 (0 is Sunday)</td>
                        <td className="py-2 px-4">* , - / ?</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <h3 className="text-lg font-medium mt-4">Special Characters</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong>*</strong> - Matches any value (wildcard)
                  </li>
                  <li>
                    <strong>,</strong> - Specifies multiple values (e.g.,
                    "1,3,5")
                  </li>
                  <li>
                    <strong>-</strong> - Specifies a range (e.g., "1-5")
                  </li>
                  <li>
                    <strong>/</strong> - Specifies increments (e.g., "*/15"
                    means every 15 units)
                  </li>
                  <li>
                    <strong>?</strong> - No specific value (used for
                    day-of-month and day-of-week)
                  </li>
                </ul>

                <h3 className="text-lg font-medium mt-4">Common Examples</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <code className="bg-muted px-1 rounded">0 0 * * *</code> -
                    Every day at midnight
                  </li>
                  <li>
                    <code className="bg-muted px-1 rounded">*/15 * * * *</code>{" "}
                    - Every 15 minutes
                  </li>
                  <li>
                    <code className="bg-muted px-1 rounded">0 9 * * 1-5</code> -
                    Every weekday at 9 AM
                  </li>
                  <li>
                    <code className="bg-muted px-1 rounded">0 0 1 * *</code> -
                    At midnight on the first day of each month
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <CronExpressionBuilder />
        </div>
      </div>
    </>
  );
}
