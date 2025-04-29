import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function Testimonials() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/50">
      <div className="px-5 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">
              Testimonials
            </div>
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
              Trusted by Buyers and Sellers
            </h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              See what our users have to say about their experience with Vokun
              Escrow Services.
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center space-x-4">
                <Avatar>
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">John Doe</p>
                  <p className="text-sm text-muted-foreground">Buyer</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                "I was hesitant to buy expensive electronics online, but Vokun
                Escrow made it safe and secure. The seller only received payment
                after I confirmed everything was as described. Great service!"
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center space-x-4">
                <Avatar>
                  <AvatarFallback>JS</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">Jane Smith</p>
                  <p className="text-sm text-muted-foreground">Seller</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                "As a small business owner, I've had issues with payment
                disputes. CMIGL Escrow has eliminated that problem completely.
                Now I know I'll get paid when I deliver quality products."
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center space-x-4">
                <Avatar>
                  <AvatarFallback>MJ</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">Michael Johnson</p>
                  <p className="text-sm text-muted-foreground">Regular User</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                "I use CMIGL Escrow for all my high-value transactions. The
                process is straightforward, and the peace of mind is worth every
                penny of the small fee they charge."
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
