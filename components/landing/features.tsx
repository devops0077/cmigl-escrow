import {
  CreditCard,
  Lock,
  RefreshCw,
  Shield,
  UserCheck,
  Wallet,
} from "lucide-react";

export function Features() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/50">
      <div className="px-5 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">
              Features
            </div>
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
              Everything You Need for Secure Transactions
            </h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Our escrow service provides a secure platform for buyers and
              sellers to transact with confidence.
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col items-center space-y-2 rounded-lg border p-6">
            <div className="rounded-full bg-primary p-2 text-primary-foreground">
              <Shield className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold">Secure Escrow</h3>
            <p className="text-center text-muted-foreground">
              Funds are held securely until both parties are satisfied with the
              transaction.
            </p>
          </div>
          <div className="flex flex-col items-center space-y-2 rounded-lg border p-6">
            <div className="rounded-full bg-primary p-2 text-primary-foreground">
              <UserCheck className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold">Dual Roles</h3>
            <p className="text-center text-muted-foreground">
              Register once and act as both buyer and seller in different
              transactions.
            </p>
          </div>
          <div className="flex flex-col items-center space-y-2 rounded-lg border p-6">
            <div className="rounded-full bg-primary p-2 text-primary-foreground">
              <Wallet className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold">Digital Wallet</h3>
            <p className="text-center text-muted-foreground">
              Manage your funds with our integrated digital wallet system.
            </p>
          </div>
          <div className="flex flex-col items-center space-y-2 rounded-lg border p-6">
            <div className="rounded-full bg-primary p-2 text-primary-foreground">
              <RefreshCw className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold">Transaction History</h3>
            <p className="text-center text-muted-foreground">
              Track all your transactions with detailed history and status
              updates.
            </p>
          </div>
          <div className="flex flex-col items-center space-y-2 rounded-lg border p-6">
            <div className="rounded-full bg-primary p-2 text-primary-foreground">
              <Lock className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold">Secure Authentication</h3>
            <p className="text-center text-muted-foreground">
              Advanced security measures to protect your account and
              transactions.
            </p>
          </div>
          <div className="flex flex-col items-center space-y-2 rounded-lg border p-6">
            <div className="rounded-full bg-primary p-2 text-primary-foreground">
              <CreditCard className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold">Easy Withdrawals</h3>
            <p className="text-center text-muted-foreground">
              Withdraw your funds to your bank account with ease.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
