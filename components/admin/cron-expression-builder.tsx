"use client";

import { useState, useEffect } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertCircle, Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

type MinuteOption = "specific" | "multiple" | "every" | "range";

interface CronExpressionBuilderProps {
  onChange?: (expression: string) => void;
  onApply?: (expression: string) => void;
  defaultValue?: string;
  className?: string;
}

export function CronExpressionBuilder({
  onChange,
  onApply,
  defaultValue = "0 * * * *",
  className,
}: CronExpressionBuilderProps) {
  const [option, setOption] = useState<MinuteOption>("specific");
  const [specificMinute, setSpecificMinute] = useState<number>(0);
  const [multipleMinutes, setMultipleMinutes] = useState<string>("0,15,30,45");
  const [everyXMinutes, setEveryXMinutes] = useState<number>(5);
  const [minuteRange, setMinuteRange] = useState<{
    start: number;
    end: number;
  }>({ start: 0, end: 30 });
  const [expression, setExpression] = useState<string>(defaultValue);
  const [isValid, setIsValid] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  // Parse default value if provided
  useEffect(() => {
    if (defaultValue) {
      const parts = defaultValue.split(" ");
      const minutePart = parts[0];

      if (minutePart.includes(",")) {
        setOption("multiple");
        setMultipleMinutes(minutePart);
      } else if (minutePart.includes("/")) {
        setOption("every");
        setEveryXMinutes(Number.parseInt(minutePart.split("/")[1], 10));
      } else if (minutePart.includes("-")) {
        setOption("range");
        const [start, end] = minutePart
          .split("-")
          .map((n) => Number.parseInt(n, 10));
        setMinuteRange({ start, end });
      } else {
        setOption("specific");
        setSpecificMinute(Number.parseInt(minutePart, 10) || 0);
      }
    }
  }, [defaultValue]);

  // Generate expression based on selected option and values
  useEffect(() => {
    let minuteExpression = "";
    let valid = true;
    let error = "";

    try {
      switch (option) {
        case "specific":
          if (specificMinute < 0 || specificMinute > 59) {
            valid = false;
            error = "Minute must be between 0 and 59";
          } else {
            minuteExpression = specificMinute.toString();
          }
          break;

        case "multiple":
          const minutes = multipleMinutes.split(",").map((m) => m.trim());

          // Validate each minute
          for (const min of minutes) {
            const num = Number.parseInt(min, 10);
            if (isNaN(num) || num < 0 || num > 59) {
              valid = false;
              error = "Each minute must be a number between 0 and 59";
              break;
            }
          }

          if (valid) {
            minuteExpression = multipleMinutes;
          }
          break;

        case "every":
          if (everyXMinutes < 1 || everyXMinutes > 59) {
            valid = false;
            error = "Interval must be between 1 and 59";
          } else {
            minuteExpression = `*/${everyXMinutes}`;
          }
          break;

        case "range":
          if (
            minuteRange.start < 0 ||
            minuteRange.start > 59 ||
            minuteRange.end < 0 ||
            minuteRange.end > 59
          ) {
            valid = false;
            error = "Minutes must be between 0 and 59";
          } else if (minuteRange.start >= minuteRange.end) {
            valid = false;
            error = "End minute must be greater than start minute";
          } else {
            minuteExpression = `${minuteRange.start}-${minuteRange.end}`;
          }
          break;
      }

      // Construct full cron expression (only changing minutes part)
      const fullExpression = `${minuteExpression} * * * *`;
      setExpression(fullExpression);
      setIsValid(valid);
      setErrorMessage(error);

      // Call onChange callback if provided
      if (valid && onChange) {
        onChange(fullExpression);
      }
    } catch (err) {
      setIsValid(false);
      setErrorMessage("Invalid cron expression");
    }
  }, [
    option,
    specificMinute,
    multipleMinutes,
    everyXMinutes,
    minuteRange,
    onChange,
  ]);

  // Handle copy to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(expression);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle apply button click
  const handleApply = () => {
    if (isValid && onApply) {
      onApply(expression);
    }
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="mr-2 h-5 w-5" />
          Cron Expression Builder
        </CardTitle>
        <CardDescription>
          Build a cron expression by selecting when you want your job to run
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Minutes Configuration</h3>
            <Badge
              variant={isValid ? "outline" : "destructive"}
              className="font-mono"
            >
              {expression}
            </Badge>
          </div>

          <RadioGroup
            value={option}
            onValueChange={(value) => setOption(value as MinuteOption)}
            className="grid grid-cols-2 gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="specific" id="specific" />
              <Label htmlFor="specific">Specific minute</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="multiple" id="multiple" />
              <Label htmlFor="multiple">Multiple minutes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="every" id="every" />
              <Label htmlFor="every">Every X minutes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="range" id="range" />
              <Label htmlFor="range">Minute range</Label>
            </div>
          </RadioGroup>

          <div className="pt-2">
            {option === "specific" && (
              <div className="space-y-2">
                <Label htmlFor="specific-minute">Select minute (0-59)</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    id="specific-minute"
                    min={0}
                    max={59}
                    step={1}
                    value={[specificMinute]}
                    onValueChange={(values) => setSpecificMinute(values[0])}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    min={0}
                    max={59}
                    value={specificMinute}
                    onChange={(e) =>
                      setSpecificMinute(
                        Number.parseInt(e.target.value, 10) || 0
                      )
                    }
                    className="w-20"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Job will run at minute {specificMinute} of every hour
                </p>
              </div>
            )}

            {option === "multiple" && (
              <div className="space-y-2">
                <Label htmlFor="multiple-minutes">
                  Enter comma-separated minutes
                </Label>
                <Input
                  id="multiple-minutes"
                  placeholder="0,15,30,45"
                  value={multipleMinutes}
                  onChange={(e) => setMultipleMinutes(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Job will run at these specific minutes of every hour
                </p>
              </div>
            )}

            {option === "every" && (
              <div className="space-y-2">
                <Label htmlFor="every-x-minutes">Every X minutes</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    id="every-x-minutes"
                    min={1}
                    max={30}
                    step={1}
                    value={[everyXMinutes]}
                    onValueChange={(values) => setEveryXMinutes(values[0])}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    min={1}
                    max={59}
                    value={everyXMinutes}
                    onChange={(e) =>
                      setEveryXMinutes(Number.parseInt(e.target.value, 10) || 5)
                    }
                    className="w-20"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Job will run every {everyXMinutes} minute
                  {everyXMinutes !== 1 ? "s" : ""}
                </p>
              </div>
            )}

            {option === "range" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="minute-range-start">Start minute</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      id="minute-range-start"
                      min={0}
                      max={58}
                      step={1}
                      value={[minuteRange.start]}
                      onValueChange={(values) =>
                        setMinuteRange({ ...minuteRange, start: values[0] })
                      }
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      min={0}
                      max={58}
                      value={minuteRange.start}
                      onChange={(e) =>
                        setMinuteRange({
                          ...minuteRange,
                          start: Number.parseInt(e.target.value, 10) || 0,
                        })
                      }
                      className="w-20"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minute-range-end">End minute</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      id="minute-range-end"
                      min={1}
                      max={59}
                      step={1}
                      value={[minuteRange.end]}
                      onValueChange={(values) =>
                        setMinuteRange({ ...minuteRange, end: values[0] })
                      }
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      min={1}
                      max={59}
                      value={minuteRange.end}
                      onChange={(e) =>
                        setMinuteRange({
                          ...minuteRange,
                          end: Number.parseInt(e.target.value, 10) || 30,
                        })
                      }
                      className="w-20"
                    />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Job will run every minute from {minuteRange.start} to{" "}
                  {minuteRange.end}
                </p>
              </div>
            )}
          </div>

          {!isValid && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <div className="flex items-center justify-between pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="flex items-center gap-1"
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? "Copied" : "Copy"}
            </Button>

            {onApply && (
              <Button onClick={handleApply} disabled={!isValid} size="sm">
                Apply Expression
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
