import Image from "next/image";

export function Partners() {
  return (
    <section className="border-b bg-muted/40">
      <div className="container mx-auto px-5 py-12">
        <p className="text-center text-sm font-medium text-muted-foreground">Our banking and payment partners</p>
        <ul className="mx-auto mt-8 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
          <PartnerTile name="Zenith Bank">
            <span className="flex items-center gap-2.5">
              <Image src="/partners/zenith-bank.svg" alt="" width={28} height={30} className="h-7 w-auto" />
              <span className="text-lg font-bold tracking-tight text-[#58595b]">Zenith Bank</span>
            </span>
          </PartnerTile>
          <PartnerTile name="Paystack">
            <Image src="/partners/paystack.svg" alt="Paystack" width={157} height={28} className="h-6 w-auto" />
          </PartnerTile>
          <PartnerTile name="OPay">
            <Image src="/partners/opay.png" alt="OPay" width={600} height={199} className="h-8 w-auto" />
          </PartnerTile>
        </ul>
      </div>
    </section>
  );
}

// Tiles stay white in both themes so the partners' brand colours remain legible.
function PartnerTile({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <li
      aria-label={name}
      className="flex h-20 items-center justify-center rounded-lg border bg-white px-6 dark:border-white/10"
    >
      {children}
    </li>
  );
}
